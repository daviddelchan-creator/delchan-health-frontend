export const PodiatryAnamnesisSchema = {
  specialty: "Podologia",
  sections: [
    {
      id: "vascular_assessment",
      title: "Avaliação Vascular",
      fields: [
        {
          id: "pedal_pulse_right",
          label: "Pulso Pedioso Direito",
          type: "choice",
          options: ["Normal", "Diminuído", "Ausente"],
          snomed: "271921003" // Pedal pulse palpation
        },
        {
          id: "pedal_pulse_left",
          label: "Pulso Pedioso Esquerdo",
          type: "choice",
          options: ["Normal", "Diminuído", "Ausente"],
          snomed: "271921003"
        }
      ]
    },
    {
      id: "dermatological_assessment",
      title: "Avaliação Dermatológica e Ungueal",
      fields: [
        {
          id: "skin_integrity",
          label: "Integridade Cutânea dos Pés",
          type: "choice",
          options: ["Íntegra", "Fissuras", "Ulcerações", "Micoses"],
          snomed: "297968009" // Foot skin condition
        },
        {
          id: "nail_pathology",
          label: "Patologia Ungueal Detectada",
          type: "choice",
          options: ["Nenhuma", "Onicocriptose (Unha Encravada)", "Onicomicose", "Onicogrifose"],
          snomed: "417116008" // Nail finding
        }
      ]
    }
  ]
};
