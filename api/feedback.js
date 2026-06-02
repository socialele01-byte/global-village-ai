export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { stance, argument } = req.body;
    if (!stance || !argument) {
        return res.status(400).json({ error: 'Missing stance or argument' });
    }

    const prompt = `你是一位國小社會科老師，正在給五年級學生的辯論觀點提供回饋。
學生選擇的立場是「${stance}」，他寫的論點如下：
「${argument}」

請用繁體中文，以溫和、鼓勵的語氣，給予 50～100 字的具體建議，幫助學生思考論點是否完整、有沒有遺漏的角度，或可以如何補充說明。
直接給建議內容即可，不要加任何標題或前言。`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 200,
                        temperature: 0.7
                    }
                })
            }
        );

        if (!geminiRes.ok) {
            const errBody = await geminiRes.text();
            throw new Error(`Gemini ${geminiRes.status}: ${errBody}`);
        }
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) throw new Error('Gemini 回傳空白內容');
        return res.status(200).json({ feedback: text.trim() });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
