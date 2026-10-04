// Dutch strings for the start menu and the profile screens.

export const profileStrings = {
  start: {
    title: (name) => `Welkom terug, ${name}`,
    titleNoProfile: 'Welkom bij Aether',
    eyebrow: 'Startmenu',
    activeProfile: 'Actief profiel · lokaal opgeslagen',
    continueAs: (name) => `Doorgaan als ${name}`,
    continueHint: 'Naar het overzicht',
    edit: 'Profiel aanpassen',
    editHint: 'Voertuigen, voorkeuren en reisregels',
    create: 'Nieuw profiel aanmaken',
    createHint: 'Voor een ander persoon op dit apparaat',
    createTitle: 'Nieuw profiel',
    choose: 'Ander profiel kiezen',
    chooseHint: (n) => (n < 2 ? 'Er is nog maar één profiel' : `${n} profielen op dit apparaat`),
    chooseTitle: 'Kies een profiel',
    activeMark: 'actief',
  },
};
