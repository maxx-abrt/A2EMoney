export type FicheTemplate = {
  id: string
  i18nKey: string
  defaultTitle: string
  defaultData: Record<string, any>
}

export const FICHE_TEMPLATES: Record<string, FicheTemplate> = {
  asso_fr: {
    id: "asso_fr",
    i18nKey: "asso_fr",
    defaultTitle: "Fiche projet associatif",
    defaultData: {
      ficheTitle: "",
      thematic: "",
      thematicOther: "",
      association: "",
      referent: "",
      phone: "",
      email: "",
      logoUrl: "",
      partnerLogoUrl: "",
      context: "",
      origin: "",
      linkToProject: "",
      audience: "",
      ageProfile: "",
      estimatedParticipants: "",
      geographicArea: "",
      needs: {
        isolation: false,
        economic: false,
        culturalAccess: false,
        educational: false,
        other: false,
      },
      needsOther: "",
      generalObjective: "",
      specificObjectives: ["", "", "", ""],
      actionTypes: {
        workshops: false,
        event: false,
        individualSupport: false,
        awareness: false,
        other: false,
      },
      actionTypesOther: "",
      actions: [
        { description: "", audience: "", frequency: "", period: "" },
        { description: "", audience: "", frequency: "", period: "" },
      ],
      volunteers: "",
      employees: "",
      externalContributors: "",
      materialResources: "",
      partners: {
        localGov: false,
        associations: false,
        schools: false,
        companies: false,
        other: false,
      },
      partnersOther: "",
      targetParticipants: "",
      targetAttendance: "",
      qualitativeIndicators: "",
      trackingTools: {
        attendance: false,
        satisfaction: false,
        collective: false,
        report: false,
        other: false,
      },
      trackingToolsOther: "",
      perspectives: "",
      date: "",
      referentSignature: "",
      boardOpinion: "",
      observations: "",
    },
  },
  blank: {
    id: "blank",
    i18nKey: "blank",
    defaultTitle: "Sheet",
    defaultData: { content: "" },
  },
}
