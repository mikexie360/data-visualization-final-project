// Function to get detailed image filename
export function getTeamDetailedImageFilename(teamName: string): string {
  // Map team names to their corresponding detailed PNG filenames
  const nameMap: Record<string, string> = {
    'Team Liquid': 'Team_Liquid_detailed.png',
    'PARIVISION': 'PARIVISION_detailed.png',
    'BetBoom Team': 'BetBoom_Team_detailed.png',
    'Team Tidebound': 'Team_Tidebound_detailed.png',
    'Gaimin Gladiators': 'Gaimin_Gladiators_detailed.png',
    'Team Spirit': 'Team_Spirit_detailed.png',
    'Team Falcons': 'Team_Falcons_detailed.png',
    'Tundra Esports': 'Tundra_Esports_detailed.png',
    'Natus Vincere': 'Natus_Vincere_detailed.png',
    'Nigma Galaxy': 'Nigma_Galaxy_detailed.png',
    'Aurora Gaming': 'Aurora_Gaming_detailed.png',
    'Xtreme Gaming': 'Xtreme_Gaming_detailed.png',
    'Team Nemesis': 'Team_Nemesis_detailed.png',
    'BOOM Esports': 'BOOM_Esports_detailed.png',
    'Wildcard': 'Wildcard_detailed.png',
    'HEROIC': 'HEROIC_detailed.png'
  }
  
  return nameMap[teamName] || `${teamName.replace(/\s+/g, '_')}_detailed.png`
}

// Function to get regular image filename
export function getTeamImageFilename(teamName: string): string {
  // Map team names to their corresponding PNG filenames
  const nameMap: Record<string, string> = {
    'Team Liquid': 'Team_Liquid.png',
    'PARIVISION': 'PARIVISION.png',
    'BetBoom Team': 'BetBoom_Team.png',
    'Team Tidebound': 'Team_Tidebound.png',
    'Gaimin Gladiators': 'Gaimin_Gladiators.png',
    'Team Spirit': 'Team_Spirit.png',
    'Team Falcons': 'Team_Falcons.png',
    'Tundra Esports': 'Tundra_Esports.png',
    'Natus Vincere': 'Natus_Vincere.png',
    'Nigma Galaxy': 'Nigma_Galaxy.png',
    'Aurora Gaming': 'Aurora_Gaming.png',
    'Xtreme Gaming': 'Xtreme_Gaming.png',
    'Team Nemesis': 'Team_Nemesis.png',
    'BOOM Esports': 'BOOM_Esports.png',
    'Wildcard': 'Wildcard.png',
    'HEROIC': 'HEROIC.png'
  }
  
  return nameMap[teamName] || `${teamName.replace(/\s+/g, '_')}.png`
}
