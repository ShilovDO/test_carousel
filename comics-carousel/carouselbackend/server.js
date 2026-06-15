const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const app = express();
const PORT = 5087;
const db = require('./db');
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

// Р’СЂРµРјРµРЅРЅРѕРµ С…СЂР°РЅРёР»РёС‰Рµ С‚Р°Р№РјРµСЂРѕРІ
const tempTimersStorage = new Map();
let currentResult = 0;
const lastSlideResult = new Map();

// РќР°СЃС‚СЂРѕР№РєРё Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMAGES_DIR),
    // Правильное решение:
    filename: (req, file, cb) => {
        const uniqueName = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/images', express.static(IMAGES_DIR, {
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store');
    }
}));

// ============================================
// РњРђР РЁР РЈРўР« РЎРўР РђРќРР¦
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'settings.html'));
});

app.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'settings.html'));
});

app.get('/result', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'result.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// ============================================
// API: Р РђР‘РћРўРђ РЎ РР—РћР‘Р РђР–Р•РќРРЇРњР
// ============================================

app.get('/api/images', (req, res) => {
    fs.readdir(IMAGES_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'РћС€РёР±РєР° С‡С‚РµРЅРёСЏ РїР°РїРєРё' });
        }
        const images = files.filter(f => /\.(webp|jpg|jpeg|png|gif)$/i.test(f));
        res.json(images);
    });
});

app.post('/api/upload', upload.array('images'), async (req, res) => {
    try {
        const uploadedFiles = req.files;
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ error: 'РќРµС‚ С„Р°Р№Р»РѕРІ РґР»СЏ Р·Р°РіСЂСѓР·РєРё' });
        }

        uploadedFiles.forEach((file) => {
            const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`;
            const newPath = path.join(IMAGES_DIR, uniqueName);
            fs.renameSync(file.path, newPath);
        });

        res.json({ success: true, message: 'Р¤Р°Р№Р»С‹ Р·Р°РіСЂСѓР¶РµРЅС‹' });
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё:', error);
        res.status(500).json({ error: 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё С„Р°Р№Р»РѕРІ' });
    }
});

app.delete('/api/delete/:name', (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.name);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Р¤Р°Р№Р» СѓРґР°Р»РµРЅ' });
        } else {
            res.status(404).json({ error: 'Р¤Р°Р№Р» РЅРµ РЅР°Р№РґРµРЅ' });
        }
    } catch (error) {
        res.status(500).json({ error: 'РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ' });
    }
});

app.post('/api/reorder', (req, res) => {
    try {
        const newOrder = req.body;
        const tempPrefix = `__temp_${Date.now()}_`;

        newOrder.forEach((filename, index) => {
            const oldPath = path.join(IMAGES_DIR, filename);
            const tempPath = path.join(IMAGES_DIR, `${tempPrefix}${index}.webp`);
            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, tempPath);
            }
        });

        newOrder.forEach((filename, index) => {
            const tempPath = path.join(IMAGES_DIR, `${tempPrefix}${index}.webp`);
            const finalPath = path.join(IMAGES_DIR, `${index + 1}.webp`);
            if (fs.existsSync(tempPath)) {
                fs.renameSync(tempPath, finalPath);
            }
        });

        res.json({ success: true, message: 'РџРѕСЂСЏРґРѕРє РёР·РјРµРЅРµРЅ' });
    } catch (error) {
        console.error('РћС€РёР±РєР° РёР·РјРµРЅРµРЅРёСЏ РїРѕСЂСЏРґРєР°:', error);
        res.status(500).json({ error: 'РћС€РёР±РєР° РёР·РјРµРЅРµРЅРёСЏ РїРѕСЂСЏРґРєР°' });
    }
});

// ============================================
// API: РљРћРќР¤РР“РЈР РђР¦РРЇ
// ============================================

app.post('/api/config/save', upload.array('images'), async (req, res) => {
    try {
        console.log('РџРѕР»СѓС‡РµРЅС‹ РґР°РЅРЅС‹Рµ:', {
            body: req.body,
            files: req.files ? req.files.length : 0
        });

        const { platform_id, config_text, comics_data } = req.body;
        const uploadedFiles = req.files || [];

        if (!platform_id) {
            return res.status(400).json({ success: false, error: 'РќРµРѕР±С…РѕРґРёРј platform_id' });
        }

        if (!config_text) {
            return res.status(400).json({ success: false, error: 'РќРµРѕР±С…РѕРґРёРј config_text' });
        }

        let comicsData = [];
        if (comics_data) {
            try {
                comicsData = typeof comics_data === 'string'
                    ? JSON.parse(comics_data)
                    : comics_data;
            } catch (e) {
                return res.status(400).json({ success: false, error: 'РќРµРІРµСЂРЅС‹Р№ С„РѕСЂРјР°С‚ comics_data' });
            }
        }

        await db.query(`
            INSERT INTO schema_comics.configs (id, test) 
            VALUES ($1, $2)
            ON CONFLICT (id) DO UPDATE SET test = EXCLUDED.test
        `, [platform_id, config_text]);

        const savedImages = [];
        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}.webp`;
            const newPath = path.join(IMAGES_DIR, uniqueName);
            fs.renameSync(file.path, newPath);
            savedImages.push({ index: i, filename: uniqueName });
        }

        await db.query('DELETE FROM schema_comics.comics WHERE id = $1', [platform_id]);

        let savedImageIndex = 0;
        for (let i = 0; i < comicsData.length; i++) {
            const comic = comicsData[i];
            let imageFilename = null;

            if (comic.image === null && savedImageIndex < savedImages.length) {
                imageFilename = savedImages[savedImageIndex].filename;
                savedImageIndex++;
            } else if (comic.image && typeof comic.image === 'string') {
                imageFilename = comic.image;
            }

            if (imageFilename) {
                await db.query(
                    'INSERT INTO schema_comics.comics (id, image, "order", description) VALUES ($1, $2, $3, $4)',
                    [platform_id, imageFilename, comic.order || i, comic.description || '']
                );
            }
        }

        res.json({ success: true, message: 'РљРѕРЅС„РёРіСѓСЂР°С†РёСЏ СЃРѕС…СЂР°РЅРµРЅР°' });

    } catch (error) {
        console.error('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/config/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const configResult = await db.query(
            'SELECT * FROM schema_comics.configs WHERE id = $1',
            [id]
        );

        const comicsResult = await db.query(
            'SELECT * FROM schema_comics.comics WHERE id = $1 ORDER BY "order"',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...(configResult.rows[0] || { test: '' }),
                comics: comicsResult.rows
            }
        });

    } catch (error) {
        console.error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ РєРѕРЅС„РёРіСѓСЂР°С†РёРё:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// API: РўРђР™РњР•Р Р« Р Р Р•Р—РЈР›Р¬РўРђРўР«
// ============================================

app.post('/api/set_result', (req, res) => {
    const { result } = req.body;
    if (result === undefined) {
        return res.status(400).send('РќРµС‚ РїР°СЂР°РјРµС‚СЂР° result');
    }
    currentResult = result;

    const platformId = req.query.platform_id || req.body.platform_id;
    if (platformId) {
        lastSlideResult.set(platformId.toString(), result);
        console.log(`РџРѕСЃР»РµРґРЅРёР№ СЃР»Р°Р№Рґ РґР»СЏ ${platformId}: ${result}`);
    }

    res.sendStatus(200);
});

app.post('/api/save_timers', async (req, res) => {
    try {
        const { platform_id, timers } = req.body;

        console.log('=== РЎРћРҐР РђРќР•РќРР• РўРђР™РњР•Р РћР’ Р’Рћ Р’Р Р•РњР•РќРќРћР• РҐР РђРќРР›РР©Р• ===');
        console.log('platform_id:', platform_id);
        console.log('timers:', JSON.stringify(timers, null, 2));

        if (!platform_id || !timers) {
            return res.status(400).json({
                success: false,
                error: 'РћС‚СЃСѓС‚СЃС‚РІСѓСЋС‚ platform_id РёР»Рё timers'
            });
        }

        tempTimersStorage.set(platform_id.toString(), {
            timers: timers,
            timestamp: Date.now()
        });

        console.log('вњ… РўР°Р№РјРµСЂС‹ СЃРѕС…СЂР°РЅРµРЅС‹ РІРѕ РІСЂРµРјРµРЅРЅРѕРј С…СЂР°РЅРёР»РёС‰Рµ');
        console.log('Р’СЃРµРіРѕ РІ С…СЂР°РЅРёР»РёС‰Рµ:', tempTimersStorage.size, 'Р·Р°РїРёСЃРµР№');

        res.json({
            success: true,
            message: 'РўР°Р№РјРµСЂС‹ СЃРѕС…СЂР°РЅРµРЅС‹ РІРѕ РІСЂРµРјРµРЅРЅРѕРµ С…СЂР°РЅРёР»РёС‰Рµ'
        });

    } catch (error) {
        console.error('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ С‚Р°Р№РјРµСЂРѕРІ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/result_save', async (req, res) => {
    try {
        console.log('=== РџРћР›РЈР§Р•Рќ Р—РђРџР РћРЎ РќРђ РЎРћРҐР РђРќР•РќРР• Р Р•Р—РЈР›Р¬РўРђРўРђ ===');
        console.log('РўРµР»Рѕ Р·Р°РїСЂРѕСЃР°:', JSON.stringify(req.body));

        const { id, user, station, route, config, date } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, error: 'РћС‚СЃСѓС‚СЃС‚РІСѓРµС‚ id' });
        }

        const resultId = parseInt(id);
        const configId = config ? parseInt(config) : 0;

        if (isNaN(resultId)) {
            return res.status(400).json({ success: false, error: 'id РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ С‡РёСЃР»РѕРј' });
        }

        await db.query(`
            INSERT INTO schema_comics.results (id, "user", station, route, config, date_time, result)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE 
            SET "user" = $2, station = $3, route = $4, config = $5, date_time = $6
        `, [
            resultId,
            parseInt(user) || 0,
            parseInt(station) || 0,
            parseInt(route) || 0,
            configId,
            date || new Date().toISOString(),
            '0'
        ]);

        console.log('вњ“ Р—Р°РїРёСЃСЊ СЂРµР·СѓР»СЊС‚Р°С‚Р° СЃРѕС…СЂР°РЅРµРЅР°, id:', resultId);

        // РЎРѕС…СЂР°РЅСЏРµРј РЅРѕРјРµСЂ РїРѕСЃР»РµРґРЅРµРіРѕ РїСЂРѕСЃРјРѕС‚СЂРµРЅРЅРѕРіРѕ СЃР»Р°Р№РґР°
        const configKey = configId.toString();
        const lastSlide = lastSlideResult.get(configKey);
        if (lastSlide) {
            await db.query(
                'UPDATE schema_comics.results SET result = $1 WHERE id = $2',
                [lastSlide.toString(), resultId]
            );
            console.log(`вњ“ РџРѕСЃР»РµРґРЅРёР№ СЃР»Р°Р№Рґ ${lastSlide} СЃРѕС…СЂР°РЅРµРЅ РґР»СЏ result_id: ${resultId}`);
            lastSlideResult.delete(configKey);
        }

        // РџСЂРѕРІРµСЂСЏРµРј РІСЂРµРјРµРЅРЅРѕРµ С…СЂР°РЅРёР»РёС‰Рµ С‚Р°Р№РјРµСЂРѕРІ
        console.log('РџРѕРёСЃРє С‚Р°Р№РјРµСЂРѕРІ РґР»СЏ config_id:', configKey);
        console.log('Р”РѕСЃС‚СѓРїРЅС‹Рµ РєР»СЋС‡Рё РІ С…СЂР°РЅРёР»РёС‰Рµ:', Array.from(tempTimersStorage.keys()));

        const tempData = tempTimersStorage.get(configKey);

        if (tempData && tempData.timers && Object.keys(tempData.timers).length > 0) {
            console.log('РќР°Р№РґРµРЅС‹ С‚Р°Р№РјРµСЂС‹ РІ С…СЂР°РЅРёР»РёС‰Рµ РґР»СЏ config_id:', configKey);
            console.log('РўР°Р№РјРµСЂС‹:', JSON.stringify(tempData.timers, null, 2));

            const insertPromises = Object.entries(tempData.timers).map(([image, time]) => {
                const roundedTime = Math.round((typeof time === 'number' ? time : parseFloat(time)) * 100) / 100;

                console.log(`РЎРѕС…СЂР°РЅРµРЅРёРµ С‚Р°Р№РјРµСЂР°: result_id=${resultId}, image=${image}, time=${roundedTime}`);

                return db.query(`
                    INSERT INTO schema_comics.images_time_result (result_id, image, time)
                    VALUES ($1, $2, $3)
                `, [resultId, image, roundedTime]);
            });

            await Promise.all(insertPromises);
            tempTimersStorage.delete(configKey);

            console.log('вњ… РўР°Р№РјРµСЂС‹ СѓСЃРїРµС€РЅРѕ СЃРѕС…СЂР°РЅРµРЅС‹ РґР»СЏ result_id:', resultId);
        } else {
            console.log('вќЊ РўР°Р№РјРµСЂС‹ РЅРµ РЅР°Р№РґРµРЅС‹ РІ С…СЂР°РЅРёР»РёС‰Рµ РґР»СЏ config_id:', configKey);
        }

        res.json({
            success: true,
            message: 'Р РµР·СѓР»СЊС‚Р°С‚ СЃРѕС…СЂР°РЅРµРЅ',
            result_id: resultId,
            timers_saved: !!tempData
        });

    } catch (error) {
        console.error('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ СЂРµР·СѓР»СЊС‚Р°С‚Р°:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Р’РђР–РќРћ: СЃРїРµС†РёС„РёС‡РЅС‹Р№ РјР°СЂС€СЂСѓС‚ Р”Рћ РѕР±С‰РµРіРѕ
// РџРѕР»СѓС‡РµРЅРёРµ РїРѕР»РЅРѕРіРѕ СЂРµР·СѓР»СЊС‚Р°С‚Р° СЃ С‚Р°Р№РјРµСЂР°РјРё Рё РІСЃРµРјРё РёР·РѕР±СЂР°Р¶РµРЅРёСЏРјРё
app.get('/api/results/:id/full', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('=== Р—РђРџР РћРЎ РџРћР›РќРћР“Рћ Р Р•Р—РЈР›Р¬РўРђРўРђ ===');
        console.log('result_id:', id);

        const resultQuery = `
            SELECT id, "user", station, route, config, date_time, result
            FROM schema_comics.results
            WHERE id = $1
        `;
        const resultData = await db.query(resultQuery, [id]);

        if (resultData.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Р РµР·СѓР»СЊС‚Р°С‚ РЅРµ РЅР°Р№РґРµРЅ'
            });
        }

        const result = resultData.rows[0];
        const configId = result.config;

        let comics = [];
        let configTitle = '';

        if (configId) {
            const configQuery = 'SELECT test FROM schema_comics.configs WHERE id = $1';
            const configData = await db.query(configQuery, [configId]);

            if (configData.rows.length > 0) {
                configTitle = configData.rows[0].test || '';
            }

            const comicsQuery = `
                SELECT image, description, "order"
                FROM schema_comics.comics
                WHERE id = $1
                ORDER BY "order"
            `;
            const comicsData = await db.query(comicsQuery, [configId]);
            comics = comicsData.rows;
        }

        const timersQuery = `
            SELECT image, time
            FROM schema_comics.images_time_result
            WHERE result_id = $1
        `;
        const timersData = await db.query(timersQuery, [id]);

        const timers = {};
        timersData.rows.forEach(row => {
            if (timers[row.image]) {
                timers[row.image] += parseFloat(row.time);
            } else {
                timers[row.image] = parseFloat(row.time);
            }
        });

        console.log('вњ… РџРѕР»РЅС‹Р№ СЂРµР·СѓР»СЊС‚Р°С‚ СЃС„РѕСЂРјРёСЂРѕРІР°РЅ');
        console.log('РР·РѕР±СЂР°Р¶РµРЅРёР№:', comics.length);
        console.log('РўР°Р№РјРµСЂРѕРІ:', Object.keys(timers).length);

        res.json({
            success: true,
            data: {
                result: {
                    id: result.id,
                    user: result.user,
                    station: result.station,
                    route: result.route,
                    config: result.config,
                    date_time: result.date_time,
                    result: result.result
                },
                comics: comics,
                timers: timers,
                configTitle: configTitle
            }
        });

    } catch (error) {
        console.error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ РїРѕР»РЅРѕРіРѕ СЂРµР·СѓР»СЊС‚Р°С‚Р°:', error);
        res.status(500).json({
            success: false,
            error: 'РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ РґР°РЅРЅС‹С…'
        });
    }
});

// РџРѕР»СѓС‡РµРЅРёРµ СЂРµР·СѓР»СЊС‚Р°С‚Р° РїРѕ ID (РѕР±С‰РёР№ РјР°СЂС€СЂСѓС‚ - РџРћРЎР›Р• СЃРїРµС†РёС„РёС‡РЅРѕРіРѕ)
app.get('/api/results/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'РќРµ РїРµСЂРµРґР°РЅ id'
            });
        }

        const query = `
            SELECT id, result
            FROM schema_comics.results
            WHERE id = $1
            ORDER BY date_time DESC
            LIMIT 1
        `;

        const dbResult = await db.query(query, [id]);

        if (dbResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Р РµР·СѓР»СЊС‚Р°С‚ РЅРµ РЅР°Р№РґРµРЅ'
            });
        }

        res.json({
            success: true,
            data: dbResult.rows[0]
        });

    } catch (error) {
        console.error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ СЂРµР·СѓР»СЊС‚Р°С‚Р°:', error);
        res.status(500).json({
            success: false,
            error: 'Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР°'
        });
    }
});

app.get('/api/timers/:result_id', async (req, res) => {
    try {
        const { result_id } = req.params;

        const result = await db.query(`
            SELECT image, time 
            FROM schema_comics.images_time_result 
            WHERE result_id = $1 
            ORDER BY time DESC
        `, [result_id]);

        res.json({
            success: true,
            data: result.rows,
            total_time: result.rows.reduce((sum, row) => sum + parseFloat(row.time), 0)
        });

    } catch (error) {
        console.error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ С‚Р°Р№РјРµСЂРѕРІ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/debug/temp-storage', (req, res) => {
    const storage = {};
    tempTimersStorage.forEach((value, key) => {
        storage[key] = value;
    });
    res.json({ success: true, data: storage });
});

app.listen(PORT, () => {
    console.log(`РЎРµСЂРІРµСЂ Р·Р°РїСѓС‰РµРЅ: http://localhost:${PORT}`);
});