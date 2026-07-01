export interface MatrixNode {
  labor: string;
  disposal: string;
}

export const VERTICAL_META: Record<string, { label: string; matrixNode: MatrixNode }> = {
  asbestos_abatement: { label: 'Asbestos Abatement', matrixNode: { labor: 'Asbestos remediation, lead paint abatement, hazmat containment, air monitoring', disposal: 'Regulated asbestos waste transport, permitted hazmat landfill disposal' } },
  concrete: { label: 'Industrial Demolition', matrixNode: { labor: 'Industrial demolition, concrete breaking, selective demolition, building implosion', disposal: 'Demolition debris processing, concrete crushing, landfill disposal' } },
  dewatering_bypass: { label: 'Dewatering & Bypass', matrixNode: { labor: 'Construction dewatering, wellpoint systems, bypass pumping, groundwater control, trench dewatering', disposal: 'Sediment basin discharge, filtration treatment, NPDEs permitted outfall discharge' } },
  elevator_inspection: { label: 'Elevator Inspection', matrixNode: { labor: 'Elevator safety inspection, certification, load testing, ASME compliance', disposal: 'Elevator modernization, obsolete equipment removal' } },
  fire_sprinkler: { label: 'Fire Sprinkler', matrixNode: { labor: 'Fire sprinkler hydrostatic testing, flow testing, NFPA 25 inspection', disposal: 'Sprinkler system decommissioning, obsolete component recycling' } },
  generator_testing: { label: 'Generator Load-Bank', matrixNode: { labor: 'Generator load bank testing, NFPA 110 compliance, emergency power testing', disposal: 'Generator decommissioning, fuel polishing waste disposal, battery recycling' } },
  hazardous_soil: { label: 'Hazardous Soil Remediation', matrixNode: { labor: 'Soil excavation, contaminated soil removal, site remediation, bio-remediation', disposal: 'Hazmat soil transport, TSCA/RCRA permitted landfill disposal, thermal treatment' } },
  high_voltage_electrical: { label: 'High-Voltage Electrical', matrixNode: { labor: 'High voltage testing, transformer maintenance, switchgear testing, cable testing, NFPA 70E compliance', disposal: 'PCB transformer disposal, SF6 recycling, decommissioned equipment recycling' } },
  hvac_balance: { label: 'HVAC Test & Balance', matrixNode: { labor: 'HVAC test and balance, air balancing, TAB services, airflow measurement', disposal: 'HVAC equipment disposal, refrigerant recovery, ductwork removal' } },
  hydro_excavation: { label: 'Hydro Excavation', matrixNode: { labor: 'Hydro excavation, potholing, daylighting, utility exposure, non-destructive digging', disposal: 'Spoils disposal, slurry containment, water management' } },
  industrial_sandblasting: { label: 'Industrial Sandblasting', matrixNode: { labor: 'Abrasive blasting, sandblasting, surface preparation, industrial coating removal, lead paint abatement', disposal: 'Spent abrasive disposal, hazardous media transport, EPA TCLP compliant disposal' } },
  industrial_wastewater: { label: 'Industrial Wastewater', matrixNode: { labor: 'Industrial wastewater treatment, process water management, pH adjustment, filtration', disposal: 'Treated effluent discharge, sludge dewatering, wastewater hauling' } },
  marine_construction: { label: 'Marine Construction', matrixNode: { labor: 'Pile driving, seawall construction, bulkhead installation, dredging, dock building', disposal: 'Dredge spoils disposal, marine debris management, sheet piling removal' } },
  medical_waste: { label: 'Medical & Biohazardous', matrixNode: { labor: 'Medical waste collection, biohazard cleanup, sharps disposal, clinical waste pickup', disposal: 'Autoclave sterilization, regulated medical waste incineration, treatment' } },
  slurry_concrete: { label: 'Slurry Processing', matrixNode: { labor: 'Concrete cutting, core drilling, saw cutting, concrete grinding, demolition', disposal: 'Slurry dewatering/recycling, washout collection, filtration, filter press operations' } },
  solar_industrial: { label: 'Industrial Solar', matrixNode: { labor: 'Solar PV installation, commercial solar mounting, electrical integration, inverter commissioning', disposal: 'Decommissioned panel recycling, inverter disposal, racking scrap metal recovery' } },
  stormwater_compliance: { label: 'Stormwater (SWPPP)', matrixNode: { labor: 'SWPPP development, stormwater inspections, compliance monitoring, erosion control', disposal: 'Stormwater treatment, sediment basin cleaning, silt removal, erosion control installation' } },
  tank_testing: { label: 'Tank Testing (UST)', matrixNode: { labor: 'UST testing, tank tightness testing, leak detection, cathodic protection testing', disposal: 'Tank removal, disposal, soil remediation, groundwater monitoring' } },
  trench_shoring: { label: 'Trench Shoring', matrixNode: { labor: 'Trench shoring, slide rail systems, hydraulic shores, trench boxes, excavation safety, CalOSHA compliance', disposal: 'Shoring equipment decontamination, steel recycling, HDPE shoring disposal' } },
  wind_energy: { label: 'Wind Energy', matrixNode: { labor: 'Wind turbine maintenance, gearbox testing, blade inspection, generator testing, electrical testing', disposal: 'Turbine decommissioning, blade recycling, gearbox disposal, transformer recycling' } },
};
