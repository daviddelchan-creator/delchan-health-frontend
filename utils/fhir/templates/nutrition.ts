export const NutritionAnamnesisSchema = {
  specialty: "Nutrição",
  sections: [
    {
      id: "anthropometry",
      title: "Composição Corporal / Antropometria",
      fields: [
        { id: "body_weight", label: "Peso Corporal (kg)", type: "number", loinc: "29463-7" },
        { id: "fat_percentage", label: "Percentual de Gordura (%)", type: "number", loinc: "73708-0" },
        { id: "muscle_mass", label: "Massa Magra Corporal (kg)", type: "number", loinc: "75859-9" },
        { id: "protein_consumption", label: "Consumo diário estimado de Proteínas (g)", type: "number", loinc: "91390-5" }
      ]
    }
  ]
};
