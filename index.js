const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello from Zerops & Antigravity IDE!');
});

// Explicitly pass '0.0.0.0' as the host parameter:
app.listen(port, '0.0.0.0', () => {
    console.log(`App running on port ${port}`);
});
