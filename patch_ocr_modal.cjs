const fs = require('fs');
const file = 'components/review/OCRReviewModal.tsx';
let data = fs.readFileSync(file, 'utf8');

// Modify the modal to handle the nested AUTOMATED_EXTRACTION/HUMAN_REVIEW structure
data = data.replace(
  'setFields(extData.fields);',
  `if (extData.HUMAN_REVIEW && extData.HUMAN_REVIEW.fields) {
                 setFields(extData.HUMAN_REVIEW.fields);
             } else if (extData.AUTOMATED_EXTRACTION && extData.AUTOMATED_EXTRACTION.fields) {
                 setFields(extData.AUTOMATED_EXTRACTION.fields);
             } else if (extData.fields) {
                 setFields(extData.fields);
             }`
);

fs.writeFileSync(file, data);
