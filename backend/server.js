import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const dbPath = path.join(__dirname, "../data/victoria.db");
const db = new Database(dbPath, {readonly: true});

const app = express();
app.use(cors());
app.use(express.json());

const qLast5 = db.prepare(`
    SELECT *
    FROM "victoria.db"
    WHERE UPPER(station_name) = UPPER(?)
    ORDER BY date DESC
    LIMIT 5
`);

app.get("/api/weather/:station_name", (req, res) => {
    try {
        const rows = qLast5.all(req.params.station_name);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Database query failed"});
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Weather API running at http://localhost:${PORT}`);
});
