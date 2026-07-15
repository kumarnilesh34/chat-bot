const fs = require('fs');
const csv = require('csv-parser');

class DiseaseClassifier {
    constructor() {
        this.diseaseCounts = {}; // P(y)
        this.symptomCounts = {}; // P(x_i | y)
        this.totalSamples = 0;
        this.symptoms = [];
    }

    async train(filepath) {
        return new Promise((resolve, reject) => {
            let isOldFormat = false;

            fs.createReadStream(filepath)
                .pipe(csv())
                .on('headers', (headers) => {
                    if (headers.includes('prognosis')) {
                        isOldFormat = true;
                        this.symptoms = headers.filter(h => h !== 'prognosis' && h.trim() !== '');
                    }
                })
                .on('data', (row) => {
                    let disease;
                    let rowSymptoms = [];

                    if (isOldFormat) {
                        disease = row['prognosis'];
                        if (disease) disease = disease.trim();
                        
                        for (const sym of this.symptoms) {
                            if (row[sym] === '1') {
                                rowSymptoms.push(sym);
                            }
                        }
                    } else if (row['Disease']) {
                        disease = row['Disease'];
                        if (disease) disease = disease.trim();

                        for (let i = 1; i <= 17; i++) {
                            const symCol = `Symptom_${i}`;
                            if (row[symCol] && row[symCol].trim() !== '') {
                                const cleanSym = row[symCol].trim();
                                rowSymptoms.push(cleanSym);
                                if (!this.symptoms.includes(cleanSym)) {
                                    this.symptoms.push(cleanSym);
                                }
                            }
                        }
                    }

                    if (!disease) return;

                    this.totalSamples++;
                    this.diseaseCounts[disease] = (this.diseaseCounts[disease] || 0) + 1;

                    if (!this.symptomCounts[disease]) {
                        this.symptomCounts[disease] = {};
                    }

                    for (const sym of rowSymptoms) {
                        this.symptomCounts[disease][sym] = (this.symptomCounts[disease][sym] || 0) + 1;
                    }
                })
                .on('end', () => {
                    console.log(`Training complete. Total samples: ${this.totalSamples}, Diseases: ${Object.keys(this.diseaseCounts).length}, Unique Symptoms: ${this.symptoms.length}`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    predict(userSymptoms) {
        // userSymptoms is an array of symptom strings matching the columns
        let bestDisease = null;
        let maxLogProb = -Infinity;
        
        const eps = 1e-6; // Laplace smoothing
        
        for (const disease in this.diseaseCounts) {
            const prob_y = this.diseaseCounts[disease] / this.totalSamples;
            let logProb = Math.log(prob_y);
            
            for (const sym of this.symptoms) {
                const count_x_y = (this.symptomCounts[disease][sym] || 0) + eps;
                const total_y = this.diseaseCounts[disease] + (eps * 2);
                const prob_x_y = count_x_y / total_y;
                
                if (userSymptoms.includes(sym)) {
                    logProb += Math.log(prob_x_y);
                } else {
                    logProb += Math.log(1 - prob_x_y);
                }
            }
            
            if (logProb > maxLogProb) {
                maxLogProb = logProb;
                bestDisease = disease;
            }
        }
        
        return bestDisease;
    }
}

module.exports = DiseaseClassifier;
