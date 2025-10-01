declare module "parquetjs-lite" {
    // Minimal surface we use in /app/api/parse-parquet/route.ts
    export class ParquetReader {
        static openBuffer(buffer: Buffer): Promise<ParquetReader>;
        getCursor(): { next(): Promise<any> };
        close(): Promise<void>;
    }

    // keep the shape open for other imports (writer/schema) if you add them later
    export class ParquetSchema {
        constructor(def: Record<string, any>);
    }
    export class ParquetWriter {
        static openFile(schema: ParquetSchema, path: string, opts?: any): Promise<ParquetWriter>;
        appendRow(row: any): Promise<void>;
        close(): Promise<void>;
    }
}
