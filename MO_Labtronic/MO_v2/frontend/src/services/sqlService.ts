import initSqlJs from "sql.js";
import { apiHandle } from "./apiService";
import type { Database, SqlJsStatic, SqlValue } from "sql.js";

async function initSql(): Promise<SqlJsStatic> {
    return await initSqlJs({ locateFile: (file: any) => `/${file}` })
}
export async function initDb(): Promise<Database> {
    const sql = await initSql()
    return new sql.Database()
}

export function createTableQuery(tableName: string, properities: Record<string, string>): string {
    let queryString = `CREATE TABLE ${tableName}(`
    queryString += Object.entries(properities).map(([k, v]) => { return ` ${k} ${v}` }).join(',')
    return queryString + ')'
}

export function downloadDb(db: Database) {
    const binary = db.export()
    const blob = new Blob([binary], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.db'
    a.click()
    a.remove()
}


export function insertDBObject(db: Database, tableName: string, keys: string[], items: any[]) {
    const insertQuery = `INSERT INTO ${tableName} VALUES ( ${keys.map(k => '?').join(',')} )`
    const stmt = db.prepare(insertQuery)
    items.forEach(item => {
        stmt.run(keys.map(k => String(item[k])))
    })
    stmt.free()
}

export function createTableInsertData(db: Database, tableName: string, props: Record<string, string>, items: any[]) {
    const keys = Object.keys(props)
    const query = createTableQuery(tableName, props)
    db.run(query)
    insertDBObject(db, tableName, keys, items)
}


export async function syncDB() {
    const db = await initDb()

    // Acount Table
    const acountData = await apiHandle('/api/collections/Accounts_T/records', 'GET', true, '?fields=id,Account_Name,Role')
    const acountItems = acountData?.data.items as any[]
    createTableInsertData(db, 'Accounts', {
        'id': ' TEXT PRIMARY KEY',
        'Account_Name': ' TEXT',
        'Role': 'TEXT'
    }, acountItems)
    db.exec("ALTER TABLE Accounts RENAME COLUMN id TO Account_ID")

    // Lab Table
    const labData = await apiHandle('/api/collections/Lab_T/records', 'GET', true, '?fields=id,Lab_Name,Lab_Code')
    const labItems = labData?.data.items as any[]
    createTableInsertData(db, 'Labs', {
        'id': ' TEXT PRIMARY KEY',
        'Lab_Name': ' TEXT',
        'Lab_Code': 'TEXT'
    }, labItems)
    db.exec("ALTER TABLE Labs RENAME COLUMN id TO Lab_ID")

    // Lab Table
    const projectData = await apiHandle('/api/collections/Projects_T/records', 'GET', true, '?fields=id,Project_Name,Project_Code,Project_Manager,Design_Engineer,Production_Engineer,University,Lab')
    const projectItems = projectData?.data.items as any[]
    createTableInsertData(db, 'Projects', {
        'id': ' TEXT PRIMARY KEY',
        'Project_Name': ' TEXT',
        'Project_Code': 'TEXT',
        'Project_Manager': 'TEXT',
        'Design_Engineer': 'TEXT',
        'Production_Engineer': 'TEXT',
        'University': 'TEXT',
        'Lab': 'TEXT'
    }, projectItems)
    db.exec("ALTER TABLE Projects RENAME COLUMN id TO Project_ID")

    // Universities Table
    const uniData = await apiHandle('/api/collections/Uni_T/records', 'GET', true, '?fields=id,Uni_Name')
    const uniItems = uniData?.data.items as any[]
    createTableInsertData(db, 'Universities', {
        'id': ' TEXT PRIMARY KEY',
        'Uni_Name': ' TEXT'
    }, uniItems)
    db.exec("ALTER TABLE Universities RENAME COLUMN id TO Uni_ID")

    downloadDb(db)
}


export async function readDbFile(file: File): Promise<[(SqlValue | undefined)[] | undefined, Database]> {
    const buffer = await file.arrayBuffer()
    const data = new Uint8Array(buffer)
    const sql = await initSql()
    const db = new sql.Database(data)
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0]
    const tablesNames = tables?.values.map(v => v[0])
    return [tablesNames, db]
}


export function dbToJson(tablesNames: string[], db: Database) {
    const data: Record<string, Record<string, any>[]> = {}
    tablesNames.forEach(tn => {
        const tableData = db.exec(`SELECT * FROM ${tn}`)[0]
        const columns = tableData?.columns
        const values = tableData?.values
        if (!columns || !values)
            return
        const objectArr: Record<string, string>[] = values.map(valueArr => {
            return Object.fromEntries(valueArr.map((v, i) => { return [columns[i], v] }))
        })
        data[tn] = objectArr
    })
    return data
}