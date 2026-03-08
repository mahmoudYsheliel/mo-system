import initSqlJs from "sql.js";
import type { Database, SqlJsStatic, SqlValue } from "sql.js";
import { getUsers } from "./apis/account.service";
import { getLabs } from "./apis/lab.service";
import { getUniversities } from "./apis/university.service";
import { getProjects } from "./apis/project.service";
import type { SqlDataType } from "@/types/sql-data-type";
import type { AccountModel } from "@/models/account.model";
import type { LabModel } from "@/models/lab.model";
import type { UniversityModel } from "@/models/university.model";

async function initSql(): Promise<SqlJsStatic> {
  return await initSqlJs({ locateFile: (file: any) => `/${file}` });
}
export async function initDb(): Promise<Database> {
  const sql = await initSql();
  return new sql.Database();
}

export function createTableQuery(
  tableName: string,
  properties: Partial<Record<string, SqlDataType>>,
): string {
  let queryString = `CREATE TABLE ${tableName}(`;
  queryString += Object.entries(properties)
    .map(([k, v]) => {
      return ` ${k} ${v}`;
    })
    .join(",");
  return queryString + ")";
}

export function downloadDb(db: Database) {
  const binary = db.export();
  const blob = new Blob([binary as Uint8Array<ArrayBuffer>], {
    type: "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.db";
  a.click();
  a.remove();
}

export function insertDBObject(
  db: Database,
  tableName: string,
  keys: string[],
  items: any[],
) {
  const insertQuery = `INSERT INTO ${tableName} VALUES ( ${keys.map((k) => "?").join(",")} )`;
  const stmt = db.prepare(insertQuery);
  items.forEach((item) => {
    stmt.run(keys.map((k) => String(item[k])));
  });
  stmt.free();
}

export function createTableInsertData<T extends object>(
  db: Database,
  tableName: string,
  props: Partial<Record<keyof T, SqlDataType>>,
  items: T[],
) {
  const keys = Object.keys(props);
  const query = createTableQuery(tableName, props);
  db.run(query);
  insertDBObject(db, tableName, keys, items);
}

export async function syncDB() {
  const db = await initDb();

  const accountRes = await getUsers();
  const labRes = await getLabs();
  const uniRes = await getUniversities();
  const projectRes = await getProjects();

  if (
    !accountRes.data?.items ||
    !labRes.data?.items ||
    !uniRes.data?.items ||
    !projectRes.data?.items
  )
    return;

  const acountItems = accountRes.data.items;
  const uniItems = uniRes.data.items;
  const labItems = labRes.data.items;
  const projectItems = projectRes.data.items;

  createTableInsertData<AccountModel>(
    db,
    "accounts",
    {
      id: "TEXT PRIMARY KEY",
      userName: "TEXT",
      roles: "TEXT",
    },
    acountItems,
  );

  createTableInsertData<LabModel>(
    db,
    "labs",
    {
      id: "TEXT PRIMARY KEY",
      name: "TEXT",
      code: "TEXT",
    },
    labItems,
  );

  createTableInsertData(
    db,
    "projects",
    {
      id: "TEXT PRIMARY KEY",
      name: "TEXT",
      code: "TEXT",
      projectManagerId: "TEXT",
      designEngineersId: "TEXT",
      productionEngineersId: "TEXT",
      universityId: "TEXT",
      labId: "TEXT",
    },
    projectItems,
  );

  createTableInsertData<UniversityModel>(
    db,
    "universities",
    {
      id: "TEXT PRIMARY KEY",
      name: "TEXT",
    },
    uniItems,
  );

  downloadDb(db);
}

export async function readDbFile(
  file: File,
): Promise<[(SqlValue | undefined)[] | undefined, Database]> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const sql = await initSql();
  const db = new sql.Database(data);
  const tables = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table'",
  )[0];
  const tablesNames = tables?.values.map((v) => v[0]);
  return [tablesNames, db];
}

export function dbToJson(tablesNames: string[], db: Database) {
  const data: Record<string, Record<string, any>[]> = {};
  tablesNames.forEach((tn) => {
    const tableData = db.exec(`SELECT * FROM ${tn}`)[0];
    const columns = tableData?.columns;
    const values = tableData?.values;
    if (!columns || !values) return;
    const objectArr: Record<string, string>[] = values.map((valueArr) => {
      return Object.fromEntries(
        valueArr.map((v, i) => {
          return [columns[i], v];
        }),
      );
    });
    data[tn] = objectArr;
  });
  return data;
}
