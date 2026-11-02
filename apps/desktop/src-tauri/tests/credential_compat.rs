#![cfg(target_os = "linux")]

use std::{env, fs, os::unix::fs::MetadataExt, path::PathBuf, process::Command};

// Run through scripts/check-credential-compat.sh, never against a desktop keychain.
fn require_private_service() {
    let root = PathBuf::from(
        env::var_os("GITHUB_CLIENT_KEYRING_FIXTURE")
            .expect("Use the isolated compatibility launcher"),
    );
    assert_eq!(root.canonicalize().unwrap(), root);
    for (variable, directory) in [
        ("HOME", "home"),
        ("XDG_RUNTIME_DIR", "runtime"),
        ("XDG_DATA_HOME", "data"),
        ("XDG_CONFIG_HOME", "config"),
        ("XDG_CACHE_HOME", "cache"),
    ] {
        let path = root.join(directory);
        assert_eq!(env::var_os(variable).map(PathBuf::from), Some(path.clone()));
        assert_eq!(fs::metadata(path).unwrap().mode() & 0o777, 0o700);
    }
    assert_eq!(fs::metadata(&root).unwrap().mode() & 0o777, 0o700);
    let expected_pid = fs::read_to_string(root.join("daemon.pid")).unwrap();
    let expected_pid = expected_pid.trim().parse::<u32>().unwrap();
    let owner = Command::new("gdbus")
        .args([
            "call",
            "--session",
            "--timeout",
            "5",
            "--dest",
            "org.freedesktop.DBus",
            "--object-path",
            "/org/freedesktop/DBus",
            "--method",
            "org.freedesktop.DBus.GetConnectionUnixProcessID",
            "org.freedesktop.secrets",
        ])
        .output()
        .expect("gdbus is required");
    assert!(
        owner.status.success(),
        "Private Secret Service is unavailable"
    );
    let owner = String::from_utf8(owner.stdout).unwrap();
    let pid = owner
        .trim()
        .strip_prefix("(uint32 ")
        .and_then(|s| s.strip_suffix(",)"))
        .expect("Unexpected D-Bus owner response")
        .parse::<u32>()
        .unwrap();
    assert_eq!(pid, expected_pid, "Secret Service is not the owned daemon");
    let process = PathBuf::from(format!("/proc/{pid}"));
    assert_eq!(fs::read_link(process.join("cwd")).unwrap(), root);
    let command = fs::read(process.join("cmdline")).unwrap();
    let args: Vec<_> = command.split(|byte| *byte == 0).collect();
    assert!(args.contains(&b"--foreground".as_slice()));
    assert!(args.contains(&root.join("control").as_os_str().as_encoded_bytes()));
}

#[test]
#[ignore = "requires scripts/check-credential-compat.sh"]
fn legacy_credentials_remain_accessible() {
    require_private_service();
    let current = keyring::Entry::new("github-client", "github-token").unwrap();
    assert!(matches!(
        current.get_password(),
        Err(keyring::Error::NoEntry)
    ));

    let legacy = legacy_keyring::Entry::new("github-client", "github-token").unwrap();
    legacy.set_password("synthetic-legacy-value").unwrap();
    assert_eq!(current.get_password().unwrap(), "synthetic-legacy-value");
    current.set_password("synthetic-current-value").unwrap();
    assert_eq!(current.get_password().unwrap(), "synthetic-current-value");
    current.delete_credential().unwrap();
    assert!(matches!(
        current.get_password(),
        Err(keyring::Error::NoEntry)
    ));
    assert!(matches!(
        legacy.get_password(),
        Err(legacy_keyring::Error::NoEntry)
    ));
}
