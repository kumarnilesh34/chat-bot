const express = require('express');
const path = require('path');
const DiseaseClassifier = require('./naive_bayes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const classifier = new DiseaseClassifier();

// Setup Natural Language Matching
function extractSymptoms(userInput) {
    const text = userInput.toLowerCase();
    const matched = [];
    for (const sym of classifier.symptoms) {
        const symClean = sym.replace(/_/g, ' ').trim();
        if (text.includes(symClean)) {
            matched.push(sym);
        }
    }
    return matched;
}

app.post('/api/chat', (req, res) => {
    const { message, currentSymptoms } = req.body;
    let newSymptoms = [...(currentSymptoms || [])];

    // Extract symptoms from user input
    const extracted = extractSymptoms(message);
    let newlyFound = [];
    y
    for (const sym of extracted) {
        if (!newSymptoms.includes(sym)) {
            newSymptoms.push(sym);
            newlyFound.push(sym.replace(/_/g, ' '));
        }
    }

    let botReply = '';
    let prediction = null;

    if (message.toLowerCase().includes('predict')) {
        if (newSymptoms.length === 0) {
            botReply = "You haven't provided any symptoms yet. Please describe what you're feeling before asking for a prediction.";
        } else {
            prediction = classifier.predict(newSymptoms);
            botReply = `Based on your symptoms, my top prediction is: **${prediction}**. \n\n*Please note this is an AI prediction and not professional medical advice. Please consult a doctor for a proper diagnosis.*`;
            newSymptoms = []; // reset after prediction
        }
    } else if (newlyFound.length > 0) {
        botReply = `I've noted the following symptoms: **${newlyFound.join(', ')}**. Do you have any other symptoms? Or type 'predict' to see my diagnosis.`;
    } else {
        botReply = "I'm not sure if I caught any specific symptoms from that. Could you describe your symptoms more clearly? (e.g., 'I have a headache and skin rash') Or type 'predict' if you're done.";
    }

    res.json({
        reply: botReply,
        symptoms: newSymptoms,
        prediction: prediction
    });
});

app.get('/api/all-symptoms', (req, res) => {
    const cleanSymptoms = classifier.symptoms.map(s => s.replace(/_/g, ' '));
    res.json(cleanSymptoms);
});

const PORT = process.env.PORT || 80;
classifier.train('training_data.csv').then(() => {
    app.listen(PORT, () => {
        console.log(`Chatbot server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to train model:', err);
});
