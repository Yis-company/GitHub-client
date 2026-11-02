import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createNodeSQLitePersistence } from "@tanstack/node-db-sqlite-persistence"
import Database from "better-sqlite3"

/** A SQLite file in a temp directory; `open` can be called again to simulate a restart. */
export function tempDatabase() {
  const file = join(mkdtempSync(join(tmpdir(), "github-client-")), "db.sqlite")
  const opened: Database.Database[] = []
  return {
    file,
    open(onStatement?: (sql: string) => void) {
      const database = new Database(file, {
        verbose: onStatement ? (sql) => onStatement(String(sql)) : undefined,
      })
      opened.push(database)
      return createNodeSQLitePersistence({ database })
    },
    tableName(collectionId: string) {
      return (
        opened[0]!
          .prepare("SELECT table_name FROM collection_registry WHERE collection_id = ?")
          .get(collectionId) as { table_name: string }
      ).table_name
    },
    close() {
      for (const database of opened.splice(0)) database.close()
    },
  }
}
