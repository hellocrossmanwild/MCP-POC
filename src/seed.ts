/**
 * @file Seed data for 50 enriched contractor profiles and 10 sample jobs across
 * Financial Services, Healthcare/Public Sector, and Technology sectors.
 * Auto-seeds on startup if the contractors table is empty. Called by index.ts.
 * Can also be run directly via `npx tsx src/seed.ts`.
 */

import { pool, initDatabase } from "./db.js";

/**
 * Shape of contractor seed data before database insertion.
 * Unlike {@link ContractorRow}, all numeric fields are actual numbers
 * (not strings) since they haven't been through the pg driver yet.
 */
interface ContractorSeed {
  name: string;
  initials: string;
  title: string;
  bio: string;
  location: string;
  day_rate: number;
  years_experience: number;
  availability: string;
  certifications: string[];
  sectors: string[];
  skills: string[];
  rating: number;
  review_count: number;
  placement_count: number;
  security_clearance: string | null;
  email: string;
  phone: string;
  linkedin_url: string;
  education: object[];
  work_history: object[];
  notable_projects: object[];
  languages: string[];
}

const financialContractors: ContractorSeed[] = [
  {
    name: "Sarah Chen", initials: "SC", title: "Senior Compliance Auditor",
    bio: "12 years in financial services compliance. Specialist in regulatory audits for tier-1 banks and insurance firms. Led GDPR transformation programmes across multiple jurisdictions.",
    location: "London", day_rate: 575, years_experience: 12, availability: "available",
    certifications: ["ISO 27001 Lead Auditor", "CREST", "GDPR Practitioner"],
    sectors: ["Banking", "Insurance", "Fintech"],
    skills: ["ISO 27001", "GDPR", "FCA Compliance", "Risk Assessment"],
    rating: 4.8, review_count: 23, placement_count: 47, security_clearance: "SC Cleared",
    email: "sarah.chen@securitycontractors.co.uk", phone: "+44 7700 900101",
    linkedin_url: "https://linkedin.com/in/sarahchen-compliance",
    education: [
      { institution: "University of Cambridge", degree: "MSc Information Security", year: 2013 },
      { institution: "University of Birmingham", degree: "BSc Computer Science", year: 2011 }
    ],
    work_history: [
      { company: "Deloitte", role: "Senior Manager, Cyber Risk", period: "2018-2023", description: "Led regulatory compliance audits for 15+ tier-1 banking clients across EMEA. Managed team of 8 consultants." },
      { company: "HSBC", role: "Compliance Analyst", period: "2013-2018", description: "Internal audit and compliance testing for retail and commercial banking operations." }
    ],
    notable_projects: [
      { name: "GDPR Transformation Programme", client: "Major UK Insurer", description: "Led end-to-end GDPR readiness programme across 4 jurisdictions. Delivered 3 months ahead of schedule." },
      { name: "ISO 27001 Certification", client: "Tier-1 Investment Bank", description: "Guided organisation through first ISO 27001 certification covering 200+ controls." }
    ],
    languages: ["English", "Mandarin"]
  },
  {
    name: "James Mitchell", initials: "JM", title: "Information Security Consultant",
    bio: "Former Big Four consultant specialising in information security governance. Deep expertise in PCI DSS compliance for payment processors.",
    location: "London", day_rate: 650, years_experience: 15, availability: "available",
    certifications: ["CISSP", "PCI DSS QSA", "ISO 27001 Lead Auditor"],
    sectors: ["Banking", "Payments", "Fintech"],
    skills: ["PCI DSS", "CISSP", "Security Governance", "Penetration Testing"],
    rating: 4.9, review_count: 31, placement_count: 62, security_clearance: "SC Cleared",
    email: "james.mitchell@securitycontractors.co.uk", phone: "+44 7700 900102",
    linkedin_url: "https://linkedin.com/in/jamesmitchell-infosec",
    education: [
      { institution: "Imperial College London", degree: "MSc Computing (Security & Reliability)", year: 2010 },
      { institution: "University of Leeds", degree: "BEng Electronic Engineering", year: 2008 }
    ],
    work_history: [
      { company: "PwC", role: "Director, Cybersecurity", period: "2015-2023", description: "Led PCI DSS advisory practice for UK financial services. Managed £3M+ annual revenue stream." },
      { company: "Barclays", role: "Information Security Manager", period: "2010-2015", description: "Managed information security governance for Barclaycard payment processing division." }
    ],
    notable_projects: [
      { name: "PCI DSS v4.0 Transition", client: "Global Payment Processor", description: "Led transition programme for PCI DSS v4.0 compliance across 12 countries." },
      { name: "Security Governance Framework", client: "Challenger Bank", description: "Designed and implemented complete security governance framework from scratch for newly licensed bank." }
    ],
    languages: ["English", "French"]
  },
  {
    name: "Priya Patel", initials: "PP", title: "GRC Analyst",
    bio: "Governance, risk and compliance specialist with focus on financial services. Strong track record in SOC 2 readiness assessments.",
    location: "London", day_rate: 480, years_experience: 7, availability: "available",
    certifications: ["ISO 27001", "SOC 2", "GDPR Practitioner"],
    sectors: ["Banking", "Insurance"],
    skills: ["GRC", "SOC 2", "Risk Management", "Policy Development"],
    rating: 4.5, review_count: 15, placement_count: 28, security_clearance: null,
    email: "priya.patel@securitycontractors.co.uk", phone: "+44 7700 900103",
    linkedin_url: "https://linkedin.com/in/priyapatel-grc",
    education: [
      { institution: "London School of Economics", degree: "MSc Risk & Finance", year: 2017 },
      { institution: "University of Warwick", degree: "BSc Mathematics", year: 2015 }
    ],
    work_history: [
      { company: "KPMG", role: "Manager, IT Risk Advisory", period: "2019-2023", description: "SOC 2 and ISO 27001 readiness assessments for banking and insurance clients." },
      { company: "Aviva", role: "Risk Analyst", period: "2017-2019", description: "Operational risk analysis and reporting for insurance operations." }
    ],
    notable_projects: [
      { name: "SOC 2 Type II Readiness", client: "Digital Banking Platform", description: "Guided fintech through first SOC 2 Type II certification in 6 months." }
    ],
    languages: ["English", "Hindi", "Gujarati"]
  },
  {
    name: "David Okonkwo", initials: "DO", title: "Cybersecurity Architect",
    bio: "Designs and implements security architectures for investment banks. Expertise in zero-trust networking and cloud security.",
    location: "London", day_rate: 700, years_experience: 18, availability: "within_30",
    certifications: ["CISSP", "CISM", "ISO 27001 Lead Auditor", "TOGAF"],
    sectors: ["Banking", "Investment Management"],
    skills: ["Security Architecture", "Zero Trust", "Cloud Security", "TOGAF"],
    rating: 5.0, review_count: 28, placement_count: 55, security_clearance: "DV Cleared",
    email: "david.okonkwo@securitycontractors.co.uk", phone: "+44 7700 900104",
    linkedin_url: "https://linkedin.com/in/davidokonkwo-architect",
    education: [
      { institution: "University of Oxford", degree: "DPhil Computer Science", year: 2007 },
      { institution: "University College London", degree: "MEng Computer Science", year: 2003 }
    ],
    work_history: [
      { company: "Goldman Sachs", role: "VP, Security Architecture", period: "2015-2023", description: "Led security architecture for global trading platforms. Designed zero-trust framework adopted across the firm." },
      { company: "BT", role: "Principal Security Architect", period: "2007-2015", description: "Designed secure network architectures for enterprise and government clients." }
    ],
    notable_projects: [
      { name: "Zero Trust Network Programme", client: "Global Investment Bank", description: "Designed and implemented zero-trust architecture across 40,000 endpoints in 15 countries." },
      { name: "Cloud Migration Security", client: "Asset Management Firm", description: "Architected security controls for £500M AUM platform migration to AWS." }
    ],
    languages: ["English", "Yoruba"]
  },
  {
    name: "Emma Thompson", initials: "ET", title: "Data Protection Officer",
    bio: "Specialist DPO for financial institutions. Managed data protection programmes for 3 FTSE 100 companies.",
    location: "London", day_rate: 550, years_experience: 10, availability: "available",
    certifications: ["GDPR Practitioner", "CIPP/E", "ISO 27001"],
    sectors: ["Banking", "Insurance", "Wealth Management"],
    skills: ["GDPR", "Data Protection", "Privacy Impact Assessment", "DPIA"],
    rating: 4.7, review_count: 19, placement_count: 35, security_clearance: null,
    email: "emma.thompson@securitycontractors.co.uk", phone: "+44 7700 900105",
    linkedin_url: "https://linkedin.com/in/emmathompson-dpo",
    education: [
      { institution: "King's College London", degree: "LLM Information Technology Law", year: 2014 },
      { institution: "University of Bristol", degree: "LLB Law", year: 2012 }
    ],
    work_history: [
      { company: "Lloyds Banking Group", role: "Data Protection Officer", period: "2019-2023", description: "Group DPO for retail banking division. Managed team of 6 privacy specialists." },
      { company: "Legal & General", role: "Senior Privacy Manager", period: "2014-2019", description: "Led privacy programme for insurance and investment management divisions." }
    ],
    notable_projects: [
      { name: "Cross-Border Data Transfer Framework", client: "FTSE 100 Bank", description: "Designed post-Schrems II data transfer framework for 30+ country operations." }
    ],
    languages: ["English"]
  },
  {
    name: "Michael Russo", initials: "MR", title: "Penetration Tester",
    bio: "CREST-certified penetration tester with extensive experience in financial services. Specialises in web application and API security testing.",
    location: "London", day_rate: 625, years_experience: 9, availability: "available",
    certifications: ["CREST CRT", "OSCP", "CEH"],
    sectors: ["Banking", "Fintech", "Payments"],
    skills: ["Penetration Testing", "Web App Security", "API Security", "Red Teaming"],
    rating: 4.6, review_count: 22, placement_count: 41, security_clearance: "SC Cleared",
    email: "michael.russo@securitycontractors.co.uk", phone: "+44 7700 900106",
    linkedin_url: "https://linkedin.com/in/michaelrusso-pentest",
    education: [
      { institution: "University of Southampton", degree: "MSc Cyber Security", year: 2015 },
      { institution: "University of Bath", degree: "BSc Computer Science", year: 2013 }
    ],
    work_history: [
      { company: "NCC Group", role: "Senior Security Consultant", period: "2018-2023", description: "Led penetration testing engagements for banking and fintech clients. Discovered 30+ critical vulnerabilities." },
      { company: "Context Information Security", role: "Security Consultant", period: "2015-2018", description: "Web application and infrastructure penetration testing for financial services." }
    ],
    notable_projects: [
      { name: "Open Banking API Security Assessment", client: "Top-5 UK Bank", description: "Comprehensive security assessment of Open Banking APIs ahead of PSD2 launch." }
    ],
    languages: ["English", "Italian"]
  },
  {
    name: "Rachel Kim", initials: "RK", title: "Regulatory Compliance Manager",
    bio: "FCA and PRA compliance expert. Has led regulatory change programmes for challenger banks and building societies.",
    location: "London", day_rate: 520, years_experience: 8, availability: "available",
    certifications: ["ISO 27001", "GDPR Practitioner", "ICA Diploma"],
    sectors: ["Banking", "Building Societies", "Fintech"],
    skills: ["FCA Compliance", "PRA Compliance", "Regulatory Change", "Operational Resilience"],
    rating: 4.4, review_count: 12, placement_count: 22, security_clearance: null,
    email: "rachel.kim@securitycontractors.co.uk", phone: "+44 7700 900107",
    linkedin_url: "https://linkedin.com/in/rachelkim-compliance",
    education: [
      { institution: "University of Edinburgh", degree: "MSc Financial Risk Management", year: 2016 },
      { institution: "University of St Andrews", degree: "MA Economics", year: 2014 }
    ],
    work_history: [
      { company: "Monzo Bank", role: "Head of Regulatory Compliance", period: "2020-2023", description: "Built compliance function from 3 to 12 people. Led FCA skilled persons review response." },
      { company: "EY", role: "Senior Consultant, Financial Services", period: "2016-2020", description: "Regulatory change advisory for banks and building societies." }
    ],
    notable_projects: [
      { name: "Operational Resilience Programme", client: "Challenger Bank", description: "Designed and implemented FCA operational resilience framework including impact tolerances and scenario testing." }
    ],
    languages: ["English", "Korean"]
  },
  {
    name: "Thomas Wright", initials: "TW", title: "SOC 2 Specialist",
    bio: "Dedicated SOC 2 consultant who has guided over 30 organisations through Type II certification. Deep fintech experience.",
    location: "Manchester", day_rate: 500, years_experience: 6, availability: "within_30",
    certifications: ["SOC 2", "ISO 27001", "CISA"],
    sectors: ["Fintech", "SaaS", "Payments"],
    skills: ["SOC 2", "Audit", "Controls Testing", "CISA"],
    rating: 4.3, review_count: 14, placement_count: 31, security_clearance: null,
    email: "thomas.wright@securitycontractors.co.uk", phone: "+44 7700 900108",
    linkedin_url: "https://linkedin.com/in/thomaswright-soc2",
    education: [
      { institution: "University of Manchester", degree: "MSc Information Systems", year: 2018 },
      { institution: "University of Sheffield", degree: "BSc Accounting & Finance", year: 2016 }
    ],
    work_history: [
      { company: "A-LIGN", role: "SOC 2 Audit Manager", period: "2020-2023", description: "Managed 40+ SOC 2 engagements for fintech and SaaS companies." },
      { company: "Grant Thornton", role: "IT Audit Associate", period: "2018-2020", description: "IT audit and controls testing for financial services clients." }
    ],
    notable_projects: [
      { name: "Accelerated SOC 2 Programme", client: "Series B Fintech", description: "Achieved SOC 2 Type II in 4 months to meet enterprise client requirements." }
    ],
    languages: ["English"]
  },
  {
    name: "Fatima Al-Hassan", initials: "FA", title: "Risk & Compliance Consultant",
    bio: "Operational risk specialist for Islamic finance and conventional banking. Multi-jurisdictional experience across UK, UAE and Saudi Arabia.",
    location: "London", day_rate: 600, years_experience: 14, availability: "available",
    certifications: ["ISO 27001 Lead Auditor", "CRISC", "GDPR Practitioner"],
    sectors: ["Banking", "Islamic Finance", "Insurance"],
    skills: ["Operational Risk", "Compliance", "Islamic Finance", "CRISC"],
    rating: 4.8, review_count: 20, placement_count: 38, security_clearance: "SC Cleared",
    email: "fatima.alhassan@securitycontractors.co.uk", phone: "+44 7700 900109",
    linkedin_url: "https://linkedin.com/in/fatimaalhassan-risk",
    education: [
      { institution: "SOAS University of London", degree: "MSc Finance & Financial Law", year: 2010 },
      { institution: "University of Bahrain", degree: "BSc Information Systems", year: 2008 }
    ],
    work_history: [
      { company: "Al Rayan Bank", role: "Head of Risk & Compliance", period: "2017-2023", description: "Led risk and compliance for UK's largest Islamic bank. Dual-regulated by FCA and PRA." },
      { company: "Standard Chartered", role: "Operational Risk Manager", period: "2010-2017", description: "Operational risk management for Middle East and Africa banking operations." }
    ],
    notable_projects: [
      { name: "Sharia-Compliant Cyber Risk Framework", client: "Islamic Finance Institution", description: "Developed first-of-its-kind cyber risk framework aligned with both ISO 27001 and AAOIFI standards." }
    ],
    languages: ["English", "Arabic"]
  },
  {
    name: "Andrew Clarke", initials: "AC", title: "IT Audit Manager",
    bio: "Internal audit specialist for financial services. ISACA certified with experience in automated audit programmes.",
    location: "Edinburgh", day_rate: 475, years_experience: 11, availability: "unavailable",
    certifications: ["CISA", "CRISC", "ISO 27001"],
    sectors: ["Banking", "Insurance", "Asset Management"],
    skills: ["IT Audit", "CISA", "Automated Auditing", "Controls Assessment"],
    rating: 4.2, review_count: 16, placement_count: 33, security_clearance: null,
    email: "andrew.clarke@securitycontractors.co.uk", phone: "+44 7700 900110",
    linkedin_url: "https://linkedin.com/in/andrewclarke-audit",
    education: [
      { institution: "University of Edinburgh", degree: "MSc Informatics", year: 2013 },
      { institution: "Heriot-Watt University", degree: "BSc Computer Science", year: 2011 }
    ],
    work_history: [
      { company: "Standard Life Aberdeen", role: "IT Audit Manager", period: "2018-2023", description: "Managed IT audit programme for asset management division. Implemented continuous auditing using ACL Analytics." },
      { company: "BDO", role: "IT Audit Senior", period: "2013-2018", description: "IT audit engagements for banking and insurance clients across Scotland." }
    ],
    notable_projects: [
      { name: "Continuous Auditing Programme", client: "Asset Management Firm", description: "Implemented automated continuous auditing covering 85% of key IT controls." }
    ],
    languages: ["English"]
  },
  {
    name: "Sophie Martin", initials: "SM", title: "Payment Security Consultant",
    bio: "PCI DSS qualified security assessor with deep expertise in payment card industry security. Has assessed 50+ merchants.",
    location: "London", day_rate: 580, years_experience: 10, availability: "available",
    certifications: ["PCI DSS QSA", "ISO 27001", "CISSP"],
    sectors: ["Payments", "Retail Banking", "E-commerce"],
    skills: ["PCI DSS", "Payment Security", "Tokenisation", "3D Secure"],
    rating: 4.7, review_count: 25, placement_count: 44, security_clearance: null,
    email: "sophie.martin@securitycontractors.co.uk", phone: "+44 7700 900111",
    linkedin_url: "https://linkedin.com/in/sophiemartin-payments",
    education: [
      { institution: "Royal Holloway, University of London", degree: "MSc Information Security", year: 2014 },
      { institution: "University of Nottingham", degree: "BSc Mathematics", year: 2012 }
    ],
    work_history: [
      { company: "Trustwave", role: "Principal QSA", period: "2018-2023", description: "Led PCI DSS assessments for major retailers and payment service providers across Europe." },
      { company: "Worldpay", role: "Security Analyst", period: "2014-2018", description: "Internal security and PCI compliance for global payment processing." }
    ],
    notable_projects: [
      { name: "Tokenisation Migration", client: "Major UK Retailer", description: "Managed migration from PAN storage to tokenisation, reducing PCI scope by 60%." }
    ],
    languages: ["English", "French"]
  },
  {
    name: "Richard Obi", initials: "RO", title: "Fraud Prevention Analyst",
    bio: "Financial crime and fraud prevention specialist. Implemented AI-driven fraud detection systems for 5 major UK banks.",
    location: "London", day_rate: 540, years_experience: 8, availability: "within_30",
    certifications: ["CISSP", "CFE", "ISO 27001"],
    sectors: ["Banking", "Payments", "Insurance"],
    skills: ["Fraud Prevention", "AML", "KYC", "Financial Crime"],
    rating: 4.5, review_count: 17, placement_count: 29, security_clearance: "SC Cleared",
    email: "richard.obi@securitycontractors.co.uk", phone: "+44 7700 900112",
    linkedin_url: "https://linkedin.com/in/richardobi-fraud",
    education: [
      { institution: "University of Cambridge", degree: "MPhil Criminology", year: 2016 },
      { institution: "University of Lagos", degree: "BSc Computer Science", year: 2013 }
    ],
    work_history: [
      { company: "Featurespace", role: "Senior Fraud Consultant", period: "2020-2023", description: "Implemented adaptive behavioural analytics for fraud detection at 5 UK banks." },
      { company: "NatWest Group", role: "Financial Crime Analyst", period: "2016-2020", description: "Transaction monitoring and suspicious activity reporting for retail banking." }
    ],
    notable_projects: [
      { name: "AI Fraud Detection Rollout", client: "Top-5 UK Bank", description: "Deployed machine learning fraud detection reducing false positives by 40% while catching 25% more genuine fraud." }
    ],
    languages: ["English", "Igbo"]
  },
  {
    name: "Laura Jenkins", initials: "LJ", title: "Cyber Risk Analyst",
    bio: "Quantitative cyber risk analyst using FAIR methodology. Translates technical risk into business language for boards.",
    location: "London", day_rate: 490, years_experience: 6, availability: "available",
    certifications: ["ISO 27001", "FAIR", "CRISC"],
    sectors: ["Banking", "Insurance", "Investment Management"],
    skills: ["Cyber Risk", "FAIR Methodology", "Risk Quantification", "Board Reporting"],
    rating: 4.3, review_count: 11, placement_count: 19, security_clearance: null,
    email: "laura.jenkins@securitycontractors.co.uk", phone: "+44 7700 900113",
    linkedin_url: "https://linkedin.com/in/laurajenkins-risk",
    education: [
      { institution: "Cass Business School", degree: "MSc Actuarial Science", year: 2018 },
      { institution: "University of Exeter", degree: "BSc Mathematics with Finance", year: 2016 }
    ],
    work_history: [
      { company: "Marsh", role: "Cyber Risk Consultant", period: "2020-2023", description: "Quantitative cyber risk assessments for insurance and banking clients using FAIR methodology." },
      { company: "Bank of England", role: "Risk Analyst (Graduate)", period: "2018-2020", description: "Systemic cyber risk analysis for UK financial system resilience." }
    ],
    notable_projects: [
      { name: "Board Cyber Risk Dashboard", client: "FTSE 250 Insurer", description: "Built quantitative cyber risk dashboard translating technical metrics into financial impact for board reporting." }
    ],
    languages: ["English"]
  },
  {
    name: "Daniel Hughes", initials: "DH", title: "Security Operations Lead",
    bio: "Built and managed SOCs for 3 major financial institutions. Expert in SIEM deployment, incident response, and threat hunting.",
    location: "London", day_rate: 620, years_experience: 13, availability: "available",
    certifications: ["CISSP", "CISM", "GCIA"],
    sectors: ["Banking", "Insurance"],
    skills: ["SOC", "SIEM", "Incident Response", "Threat Hunting"],
    rating: 4.9, review_count: 26, placement_count: 48, security_clearance: "SC Cleared",
    email: "daniel.hughes@securitycontractors.co.uk", phone: "+44 7700 900114",
    linkedin_url: "https://linkedin.com/in/danielhughes-secops",
    education: [
      { institution: "Cranfield University", degree: "MSc Cyber Defence & Information Assurance", year: 2011 },
      { institution: "University of York", degree: "BEng Electronic Engineering", year: 2009 }
    ],
    work_history: [
      { company: "JP Morgan", role: "VP, Security Operations", period: "2017-2023", description: "Built and led 24/7 SOC for EMEA operations. Managed team of 25 analysts and engineers." },
      { company: "BAE Systems Applied Intelligence", role: "Senior SOC Analyst", period: "2011-2017", description: "Managed SOC delivery for banking clients. Deployed Splunk and QRadar SIEM platforms." }
    ],
    notable_projects: [
      { name: "SIEM Consolidation Programme", client: "Global Bank", description: "Consolidated 4 legacy SIEM platforms into unified Splunk deployment. Reduced MTTR from 4 hours to 45 minutes." }
    ],
    languages: ["English", "Welsh"]
  },
  {
    name: "Nina Petrova", initials: "NP", title: "Cloud Security Engineer",
    bio: "Secures cloud infrastructure for fintech startups and challenger banks. AWS and Azure security specialist.",
    location: "London", day_rate: 590, years_experience: 7, availability: "available",
    certifications: ["AWS Security Specialty", "ISO 27001", "CKS"],
    sectors: ["Fintech", "Banking", "Payments"],
    skills: ["AWS Security", "Azure Security", "Cloud Architecture", "Kubernetes Security"],
    rating: 4.6, review_count: 13, placement_count: 24, security_clearance: null,
    email: "nina.petrova@securitycontractors.co.uk", phone: "+44 7700 900115",
    linkedin_url: "https://linkedin.com/in/ninapetrova-cloud",
    education: [
      { institution: "University of Bristol", degree: "MSc Computer Science", year: 2017 },
      { institution: "Moscow State University", degree: "BSc Applied Mathematics", year: 2015 }
    ],
    work_history: [
      { company: "Revolut", role: "Senior Cloud Security Engineer", period: "2020-2023", description: "Secured multi-cloud infrastructure supporting 25M+ customers. Led Kubernetes security hardening." },
      { company: "ThoughtWorks", role: "Security Engineer", period: "2017-2020", description: "Embedded security engineer for fintech client projects." }
    ],
    notable_projects: [
      { name: "Multi-Cloud Security Posture", client: "Digital Bank", description: "Implemented Cloud Security Posture Management across AWS and GCP, reducing critical misconfigurations by 90%." }
    ],
    languages: ["English", "Russian", "Bulgarian"]
  },
  {
    name: "George Atkinson", initials: "GA", title: "Regulatory Technology Consultant",
    bio: "RegTech implementation specialist. Has deployed compliance automation solutions across tier-2 banks.",
    location: "London", day_rate: 560, years_experience: 9, availability: "unavailable",
    certifications: ["ISO 27001", "GDPR Practitioner", "TOGAF"],
    sectors: ["Banking", "Fintech", "RegTech"],
    skills: ["RegTech", "Compliance Automation", "Process Design", "TOGAF"],
    rating: 4.4, review_count: 15, placement_count: 27, security_clearance: null,
    email: "george.atkinson@securitycontractors.co.uk", phone: "+44 7700 900116",
    linkedin_url: "https://linkedin.com/in/georgeatkinson-regtech",
    education: [
      { institution: "University of Warwick", degree: "MSc Business Analytics", year: 2015 },
      { institution: "Durham University", degree: "BSc Computer Science", year: 2013 }
    ],
    work_history: [
      { company: "Suade Labs", role: "Implementation Director", period: "2019-2023", description: "Led RegTech platform implementations for tier-2 banks across Europe." },
      { company: "Accenture", role: "Manager, Financial Services", period: "2015-2019", description: "Regulatory change and technology transformation for banking clients." }
    ],
    notable_projects: [
      { name: "Automated Regulatory Reporting", client: "Tier-2 Bank", description: "Deployed automated regulatory reporting reducing manual effort by 70% and eliminating late submissions." }
    ],
    languages: ["English"]
  },
  {
    name: "Olivia Barnes", initials: "OB", title: "Third Party Risk Manager",
    bio: "Manages vendor and third-party risk for banking clients. Expert in supply chain security assessments.",
    location: "Bristol", day_rate: 470, years_experience: 8, availability: "available",
    certifications: ["ISO 27001", "CTPRP", "GDPR Practitioner"],
    sectors: ["Banking", "Insurance", "Fintech"],
    skills: ["Third Party Risk", "Vendor Assessment", "Supply Chain Security", "Due Diligence"],
    rating: 4.5, review_count: 14, placement_count: 26, security_clearance: null,
    email: "olivia.barnes@securitycontractors.co.uk", phone: "+44 7700 900117",
    linkedin_url: "https://linkedin.com/in/oliviabarnes-tprm",
    education: [
      { institution: "University of Bristol", degree: "MSc Management", year: 2016 },
      { institution: "Cardiff University", degree: "BSc Business Information Systems", year: 2014 }
    ],
    work_history: [
      { company: "Nationwide Building Society", role: "Third Party Risk Manager", period: "2019-2023", description: "Managed third-party risk programme covering 500+ suppliers. Implemented risk-based tiering framework." },
      { company: "Willis Towers Watson", role: "Risk Consultant", period: "2016-2019", description: "Vendor risk assessments and supply chain security reviews for financial services." }
    ],
    notable_projects: [
      { name: "TPRM Framework Overhaul", client: "Building Society", description: "Redesigned third-party risk management framework aligned with FCA/PRA outsourcing requirements." }
    ],
    languages: ["English"]
  },
  {
    name: "William Foster", initials: "WF", title: "Business Continuity Consultant",
    bio: "Business continuity and disaster recovery specialist for financial services. ISO 22301 lead implementer.",
    location: "London", day_rate: 510, years_experience: 12, availability: "within_30",
    certifications: ["ISO 22301 Lead Implementer", "ISO 27001", "BCI Certificate"],
    sectors: ["Banking", "Insurance", "Asset Management"],
    skills: ["Business Continuity", "Disaster Recovery", "ISO 22301", "Crisis Management"],
    rating: 4.6, review_count: 18, placement_count: 36, security_clearance: null,
    email: "william.foster@securitycontractors.co.uk", phone: "+44 7700 900118",
    linkedin_url: "https://linkedin.com/in/williamfoster-bc",
    education: [
      { institution: "Loughborough University", degree: "MSc Information Management", year: 2012 },
      { institution: "University of Leicester", degree: "BSc Geography", year: 2010 }
    ],
    work_history: [
      { company: "Zurich Insurance", role: "Business Continuity Manager", period: "2017-2023", description: "Managed BC programme for UK & Ireland operations. Led response to 3 major incidents." },
      { company: "Sungard Availability Services", role: "BC Consultant", period: "2012-2017", description: "Business continuity consulting for financial services clients." }
    ],
    notable_projects: [
      { name: "Pandemic Response Framework", client: "Insurance Group", description: "Developed and activated pandemic business continuity framework during COVID-19 for 5,000 employees." }
    ],
    languages: ["English"]
  },
  {
    name: "Charlotte Edwards", initials: "CE", title: "Identity & Access Management Lead",
    bio: "IAM architect for large-scale banking environments. Expert in privileged access management and zero-trust identity.",
    location: "London", day_rate: 640, years_experience: 11, availability: "available",
    certifications: ["CISSP", "ISO 27001", "CIAM"],
    sectors: ["Banking", "Insurance", "Wealth Management"],
    skills: ["IAM", "PAM", "Zero Trust Identity", "Active Directory"],
    rating: 4.7, review_count: 21, placement_count: 40, security_clearance: "SC Cleared",
    email: "charlotte.edwards@securitycontractors.co.uk", phone: "+44 7700 900119",
    linkedin_url: "https://linkedin.com/in/charlotteedwards-iam",
    education: [
      { institution: "University of Surrey", degree: "MSc Information Security", year: 2013 },
      { institution: "University of Reading", degree: "BSc Computer Science", year: 2011 }
    ],
    work_history: [
      { company: "Morgan Stanley", role: "IAM Lead", period: "2018-2023", description: "Led IAM programme for EMEA operations covering 15,000 identities. Implemented CyberArk PAM." },
      { company: "Capgemini", role: "IAM Consultant", period: "2013-2018", description: "Identity and access management consulting for banking and insurance clients." }
    ],
    notable_projects: [
      { name: "PAM Programme", client: "Investment Bank", description: "Implemented privileged access management covering 3,000 privileged accounts with 99.9% adoption." }
    ],
    languages: ["English"]
  },
  {
    name: "Alexander Scott", initials: "AS", title: "Security Assurance Manager",
    bio: "Leads security assurance programmes for banking transformation projects. ISO 27001 implementation specialist.",
    location: "Leeds", day_rate: 450, years_experience: 5, availability: "available",
    certifications: ["ISO 27001", "CISM", "GDPR Practitioner"],
    sectors: ["Banking", "Building Societies"],
    skills: ["Security Assurance", "ISO 27001", "Programme Management", "Transformation"],
    rating: 3.9, review_count: 8, placement_count: 14, security_clearance: null,
    email: "alexander.scott@securitycontractors.co.uk", phone: "+44 7700 900120",
    linkedin_url: "https://linkedin.com/in/alexanderscott-assurance",
    education: [
      { institution: "University of Leeds", degree: "MSc Cyber Security", year: 2019 },
      { institution: "Leeds Beckett University", degree: "BSc Information Technology", year: 2017 }
    ],
    work_history: [
      { company: "Yorkshire Building Society", role: "Security Assurance Manager", period: "2021-2023", description: "Led security assurance for digital transformation programme." },
      { company: "KPMG", role: "IT Risk Associate", period: "2019-2021", description: "Security assurance and ISO 27001 implementation support for banking clients." }
    ],
    notable_projects: [
      { name: "ISO 27001 Certification", client: "Building Society", description: "Led first-time ISO 27001 certification covering core banking and digital channels." }
    ],
    languages: ["English"]
  },
];

const healthcareContractors: ContractorSeed[] = [
  {
    name: "Helen Brooks", initials: "HB", title: "NHS Digital Security Consultant",
    bio: "10 years securing NHS trusts and health boards. DSPT assessment specialist with deep understanding of health data governance.",
    location: "Birmingham", day_rate: 480, years_experience: 10, availability: "available",
    certifications: ["ISO 27001", "Cyber Essentials Plus", "DSPT Assessor"],
    sectors: ["NHS", "Healthcare", "Public Sector"],
    skills: ["DSPT", "NHS Data Security", "Clinical Systems Security", "IG Toolkit"],
    rating: 4.7, review_count: 19, placement_count: 36, security_clearance: "SC Cleared",
    email: "helen.brooks@securitycontractors.co.uk", phone: "+44 7700 900121",
    linkedin_url: "https://linkedin.com/in/helenbrooks-nhs",
    education: [
      { institution: "University of Birmingham", degree: "MSc Health Informatics", year: 2014 },
      { institution: "Aston University", degree: "BSc Computer Science", year: 2012 }
    ],
    work_history: [
      { company: "NHS England", role: "Senior Cyber Security Advisor", period: "2018-2023", description: "Advised 40+ NHS trusts on DSPT compliance and cyber security improvement. Led incident response for 3 ransomware events." },
      { company: "University Hospitals Birmingham", role: "IG & Security Manager", period: "2014-2018", description: "Information governance and security management for major acute trust." }
    ],
    notable_projects: [
      { name: "Post-WannaCry Resilience Programme", client: "NHS Region", description: "Led cyber resilience improvement across 12 trusts following WannaCry. Achieved 100% DSPT compliance." }
    ],
    languages: ["English"]
  },
  {
    name: "Mark Stevens", initials: "MS", title: "Public Sector Cyber Consultant",
    bio: "Cyber security consultant for central and local government. NCSC certified practitioner with CAF assessment experience.",
    location: "London", day_rate: 550, years_experience: 13, availability: "available",
    certifications: ["ISO 27001 Lead Auditor", "NCSC Certified Practitioner", "Cyber Essentials Plus"],
    sectors: ["Central Government", "Local Government", "NHS"],
    skills: ["CAF Assessment", "NCSC Framework", "Security Architecture", "Cyber Essentials"],
    rating: 4.8, review_count: 24, placement_count: 45, security_clearance: "SC Cleared",
    email: "mark.stevens@securitycontractors.co.uk", phone: "+44 7700 900122",
    linkedin_url: "https://linkedin.com/in/markstevens-publicsector",
    education: [
      { institution: "Royal Holloway, University of London", degree: "MSc Information Security", year: 2011 },
      { institution: "University of Exeter", degree: "BSc Computer Science", year: 2009 }
    ],
    work_history: [
      { company: "Cabinet Office", role: "Senior Cyber Security Advisor", period: "2017-2023", description: "Advised government departments on NCSC CAF implementation. Led cross-government security improvement programmes." },
      { company: "PA Consulting", role: "Cyber Security Consultant", period: "2011-2017", description: "Cyber security consulting for central government and defence clients." }
    ],
    notable_projects: [
      { name: "CAF Implementation Programme", client: "Government Department", description: "Led Cyber Assessment Framework implementation achieving 'Achieved' across all 14 principles." }
    ],
    languages: ["English"]
  },
  {
    name: "Rebecca Taylor", initials: "RT", title: "Health Data Protection Specialist",
    bio: "Caldicott guardian support and health data DPIA specialist. Has managed data protection for 8 NHS trusts.",
    location: "Manchester", day_rate: 460, years_experience: 9, availability: "available",
    certifications: ["GDPR Practitioner", "DSPT Assessor", "ISO 27001"],
    sectors: ["NHS", "Healthcare", "Social Care"],
    skills: ["Health Data Protection", "Caldicott", "DPIA", "GDPR"],
    rating: 4.5, review_count: 16, placement_count: 30, security_clearance: null,
    email: "rebecca.taylor@securitycontractors.co.uk", phone: "+44 7700 900123",
    linkedin_url: "https://linkedin.com/in/rebeccataylor-healthdata",
    education: [
      { institution: "University of Manchester", degree: "LLM Health Care Law", year: 2015 },
      { institution: "University of Liverpool", degree: "LLB Law", year: 2013 }
    ],
    work_history: [
      { company: "Manchester University NHS Foundation Trust", role: "Data Protection Officer", period: "2019-2023", description: "DPO for one of UK's largest NHS trusts. Managed 200+ DPIAs and Caldicott reviews annually." },
      { company: "Hill Dickinson LLP", role: "Healthcare Data Solicitor", period: "2015-2019", description: "Advised NHS and private healthcare clients on data protection law." }
    ],
    notable_projects: [
      { name: "Integrated Care Record DPIA", client: "NHS ICB", description: "Led DPIA for integrated care record sharing across 15 organisations covering 2M patients." }
    ],
    languages: ["English"]
  },
  {
    name: "Patrick O'Brien", initials: "PO", title: "Government Security Architect",
    bio: "Designs secure systems for MOD and Home Office. Expert in cloud security for classified environments.",
    location: "London", day_rate: 600, years_experience: 16, availability: "within_30",
    certifications: ["CISSP", "ISO 27001 Lead Auditor", "CCP SIRA"],
    sectors: ["MOD", "Central Government", "Intelligence"],
    skills: ["Security Architecture", "Classified Systems", "Cloud Security", "HMG Policy"],
    rating: 4.9, review_count: 20, placement_count: 38, security_clearance: "DV Cleared",
    email: "patrick.obrien@securitycontractors.co.uk", phone: "+44 7700 900124",
    linkedin_url: "https://linkedin.com/in/patrickobrien-govsec",
    education: [
      { institution: "Cranfield University", degree: "MSc Cyber Defence", year: 2008 },
      { institution: "Queen's University Belfast", degree: "BEng Software Engineering", year: 2006 }
    ],
    work_history: [
      { company: "Ministry of Defence", role: "Principal Security Architect", period: "2014-2023", description: "Designed security architectures for classified MOD systems. Led cloud security accreditation for SECRET workloads." },
      { company: "Thales UK", role: "Security Architect", period: "2008-2014", description: "Security architecture for defence and government communication systems." }
    ],
    notable_projects: [
      { name: "Cloud SECRET Accreditation", client: "MOD", description: "First accreditation of cloud platform for SECRET-rated workloads in UK defence." }
    ],
    languages: ["English", "Irish"]
  },
  {
    name: "Karen Walsh", initials: "KW", title: "Cyber Essentials Assessor",
    bio: "IASME-certified Cyber Essentials assessor. Has certified over 200 public sector and healthcare organisations.",
    location: "Cardiff", day_rate: 400, years_experience: 6, availability: "available",
    certifications: ["Cyber Essentials Plus Assessor", "ISO 27001", "IASME Governance"],
    sectors: ["Public Sector", "Healthcare", "Education"],
    skills: ["Cyber Essentials", "IASME", "Security Assessment", "Gap Analysis"],
    rating: 4.3, review_count: 22, placement_count: 58, security_clearance: null,
    email: "karen.walsh@securitycontractors.co.uk", phone: "+44 7700 900125",
    linkedin_url: "https://linkedin.com/in/karenwalsh-cyberessentials",
    education: [
      { institution: "Cardiff University", degree: "MSc Computing & IT Management", year: 2018 },
      { institution: "Swansea University", degree: "BSc Computer Science", year: 2016 }
    ],
    work_history: [
      { company: "IASME Consortium", role: "Senior Assessor", period: "2020-2023", description: "Conducted 150+ Cyber Essentials Plus assessments for public sector and healthcare." },
      { company: "Welsh Government", role: "Cyber Security Officer", period: "2018-2020", description: "Supported Welsh public sector organisations with Cyber Essentials certification." }
    ],
    notable_projects: [
      { name: "Bulk CE+ Programme", client: "Welsh NHS", description: "Assessed and certified 7 Welsh health boards for Cyber Essentials Plus in coordinated programme." }
    ],
    languages: ["English", "Welsh"]
  },
  {
    name: "Simon Harris", initials: "SH", title: "Digital Health Security Lead",
    bio: "Secures digital health platforms and medical IoT devices. Former NHS England digital team.",
    location: "Leeds", day_rate: 520, years_experience: 11, availability: "available",
    certifications: ["ISO 27001", "DSPT Assessor", "CEH"],
    sectors: ["NHS", "Health Tech", "Public Sector"],
    skills: ["Medical IoT Security", "Digital Health", "DSPT", "Health Tech"],
    rating: 4.6, review_count: 15, placement_count: 28, security_clearance: "SC Cleared",
    email: "simon.harris@securitycontractors.co.uk", phone: "+44 7700 900126",
    linkedin_url: "https://linkedin.com/in/simonharris-healthtech",
    education: [
      { institution: "University of Leeds", degree: "MSc Medical Engineering", year: 2013 },
      { institution: "University of Bradford", degree: "BEng Biomedical Engineering", year: 2011 }
    ],
    work_history: [
      { company: "NHS England", role: "Digital Security Lead", period: "2018-2023", description: "Led security for NHS App and digital health platforms. Assessed medical device cyber security." },
      { company: "Philips Healthcare", role: "Security Engineer", period: "2013-2018", description: "Product security for medical imaging and patient monitoring systems." }
    ],
    notable_projects: [
      { name: "Medical IoT Security Framework", client: "NHS Trust", description: "Developed security framework for 5,000+ connected medical devices including infusion pumps and patient monitors." }
    ],
    languages: ["English"]
  },
  {
    name: "Angela Morrison", initials: "AM", title: "Information Governance Manager",
    bio: "IG specialist for NHS and social care. Expert in freedom of information, subject access requests and records management.",
    location: "Glasgow", day_rate: 430, years_experience: 8, availability: "within_30",
    certifications: ["GDPR Practitioner", "ISO 27001", "BCS IG Certificate"],
    sectors: ["NHS", "Social Care", "Local Government"],
    skills: ["Information Governance", "FOI", "SAR", "Records Management"],
    rating: 4.4, review_count: 13, placement_count: 25, security_clearance: null,
    email: "angela.morrison@securitycontractors.co.uk", phone: "+44 7700 900127",
    linkedin_url: "https://linkedin.com/in/angelamorrison-ig",
    education: [
      { institution: "University of Strathclyde", degree: "MSc Information Management", year: 2016 },
      { institution: "University of Glasgow", degree: "MA History", year: 2014 }
    ],
    work_history: [
      { company: "NHS Greater Glasgow & Clyde", role: "IG Manager", period: "2019-2023", description: "Managed IG programme for Scotland's largest health board. Processed 1,500+ SARs annually." },
      { company: "Scottish Government", role: "FOI Officer", period: "2016-2019", description: "Freedom of information and records management for Scottish Government departments." }
    ],
    notable_projects: [
      { name: "Digital Records Transformation", client: "NHS Health Board", description: "Led digitisation and secure disposal of 500,000 paper health records." }
    ],
    languages: ["English"]
  },
  {
    name: "Peter Goodwin", initials: "PG", title: "Public Sector Risk Consultant",
    bio: "Risk management consultant for public sector organisations. National Risk Assessment framework specialist.",
    location: "London", day_rate: 540, years_experience: 14, availability: "available",
    certifications: ["ISO 27001 Lead Auditor", "CRISC", "Cyber Essentials Plus"],
    sectors: ["Central Government", "Local Government", "NHS"],
    skills: ["Risk Assessment", "NRA Framework", "CRISC", "Risk Register"],
    rating: 4.7, review_count: 18, placement_count: 34, security_clearance: "SC Cleared",
    email: "peter.goodwin@securitycontractors.co.uk", phone: "+44 7700 900128",
    linkedin_url: "https://linkedin.com/in/petergoodwin-risk",
    education: [
      { institution: "King's College London", degree: "MSc National Security Studies", year: 2010 },
      { institution: "University of Nottingham", degree: "BSc Politics", year: 2008 }
    ],
    work_history: [
      { company: "Home Office", role: "Senior Risk Advisor", period: "2016-2023", description: "Advised on national security risk assessment and departmental cyber risk management." },
      { company: "Deloitte", role: "Manager, Public Sector Risk", period: "2010-2016", description: "Risk advisory for central government departments and agencies." }
    ],
    notable_projects: [
      { name: "Departmental Cyber Risk Review", client: "Government Department", description: "Complete review and redesign of cyber risk framework aligned with National Cyber Strategy." }
    ],
    languages: ["English"]
  },
  {
    name: "Lucy Bennett", initials: "LB", title: "Clinical Systems Security Analyst",
    bio: "Specialises in securing EPR systems, clinical portals and health information exchanges. Former NHS trust CISO.",
    location: "Bristol", day_rate: 500, years_experience: 10, availability: "unavailable",
    certifications: ["ISO 27001", "CISSP", "DSPT Assessor"],
    sectors: ["NHS", "Healthcare", "Health Tech"],
    skills: ["EPR Security", "Clinical Systems", "HL7 FHIR Security", "CISO"],
    rating: 4.8, review_count: 21, placement_count: 39, security_clearance: "SC Cleared",
    email: "lucy.bennett@securitycontractors.co.uk", phone: "+44 7700 900129",
    linkedin_url: "https://linkedin.com/in/lucybennett-clinicalsec",
    education: [
      { institution: "University of Bath", degree: "MSc Computer Science", year: 2014 },
      { institution: "University of Bristol", degree: "BSc Biomedical Sciences", year: 2012 }
    ],
    work_history: [
      { company: "North Bristol NHS Trust", role: "CISO", period: "2019-2023", description: "Chief Information Security Officer for acute NHS trust. Managed team of 5." },
      { company: "Cerner (now Oracle Health)", role: "Security Consultant", period: "2014-2019", description: "Security consultant for EPR implementations across UK NHS trusts." }
    ],
    notable_projects: [
      { name: "EPR Security Architecture", client: "NHS Trust", description: "Designed security architecture for £30M EPR deployment covering 8,000 clinical users." }
    ],
    languages: ["English"]
  },
  {
    name: "Ian Crawford", initials: "IC", title: "Local Government Cyber Lead",
    bio: "Leads cyber security programmes for county and borough councils. LGA cyber peer assessment trained.",
    location: "Nottingham", day_rate: 440, years_experience: 7, availability: "available",
    certifications: ["Cyber Essentials Plus", "ISO 27001", "NCSC Certified Practitioner"],
    sectors: ["Local Government", "Education", "Public Sector"],
    skills: ["LGA Cyber", "Council Security", "PSN Compliance", "Cyber Essentials"],
    rating: 4.2, review_count: 10, placement_count: 18, security_clearance: null,
    email: "ian.crawford@securitycontractors.co.uk", phone: "+44 7700 900130",
    linkedin_url: "https://linkedin.com/in/iancrawford-localgov",
    education: [
      { institution: "Nottingham Trent University", degree: "MSc Cyber Security", year: 2017 },
      { institution: "University of Derby", degree: "BSc IT Management", year: 2015 }
    ],
    work_history: [
      { company: "Nottinghamshire County Council", role: "Cyber Security Lead", period: "2020-2023", description: "Led cyber security programme for county council and partner organisations." },
      { company: "Socitm Advisory", role: "Cyber Security Consultant", period: "2017-2020", description: "Cyber security advisory for local government clients across England." }
    ],
    notable_projects: [
      { name: "PSN Remediation Programme", client: "Borough Council", description: "Led remediation programme achieving PSN compliance after 2-year non-compliance period." }
    ],
    languages: ["English"]
  },
  {
    name: "Diane Fletcher", initials: "DF", title: "Healthcare Compliance Auditor",
    bio: "Audits healthcare organisations against CQC, DSPT and ISO standards. Dual-qualified in clinical governance and information security.",
    location: "Sheffield", day_rate: 470, years_experience: 9, availability: "available",
    certifications: ["ISO 27001 Lead Auditor", "DSPT Assessor", "GDPR Practitioner"],
    sectors: ["NHS", "Private Healthcare", "Social Care"],
    skills: ["Healthcare Audit", "CQC", "DSPT", "Clinical Governance"],
    rating: 4.5, review_count: 17, placement_count: 32, security_clearance: null,
    email: "diane.fletcher@securitycontractors.co.uk", phone: "+44 7700 900131",
    linkedin_url: "https://linkedin.com/in/dianefletcher-healthaudit",
    education: [
      { institution: "University of Sheffield", degree: "MSc Health Services Research", year: 2015 },
      { institution: "Sheffield Hallam University", degree: "BSc Nursing", year: 2012 }
    ],
    work_history: [
      { company: "Care Quality Commission", role: "Specialist Digital Advisor", period: "2019-2023", description: "Advised CQC inspection teams on digital and data security aspects of healthcare regulation." },
      { company: "Sheffield Teaching Hospitals", role: "IG & Audit Lead", period: "2015-2019", description: "Information governance and internal audit for large acute NHS trust." }
    ],
    notable_projects: [
      { name: "CQC Digital Assessment Framework", client: "CQC", description: "Helped develop CQC's approach to assessing digital and cyber security in healthcare inspections." }
    ],
    languages: ["English"]
  },
  {
    name: "Robert Nash", initials: "RN", title: "Defence Security Consultant",
    bio: "Defence and intelligence security specialist. JSP 440 and JSP 604 expert. Former MOD security officer.",
    location: "London", day_rate: 580, years_experience: 20, availability: "within_30",
    certifications: ["ISO 27001 Lead Auditor", "CISSP", "CCP SIRA"],
    sectors: ["MOD", "Defence Industry", "Intelligence"],
    skills: ["JSP 440", "JSP 604", "Defence Security", "Classified Systems"],
    rating: 4.9, review_count: 15, placement_count: 30, security_clearance: "DV Cleared",
    email: "robert.nash@securitycontractors.co.uk", phone: "+44 7700 900132",
    linkedin_url: "https://linkedin.com/in/robertnash-defence",
    education: [
      { institution: "King's College London", degree: "MA War Studies", year: 2004 },
      { institution: "Royal Military Academy Sandhurst", degree: "Military Commission", year: 2000 }
    ],
    work_history: [
      { company: "Ministry of Defence", role: "Senior Security Officer", period: "2010-2023", description: "Managed physical and information security for MOD establishments. JSP 440/604 policy implementation." },
      { company: "British Army", role: "Royal Signals Officer", period: "2000-2010", description: "Communications and information security for military operations." }
    ],
    notable_projects: [
      { name: "Defence Security Policy Review", client: "MOD", description: "Co-authored update to JSP 604 (Security of Information) policy framework." }
    ],
    languages: ["English"]
  },
  {
    name: "Fiona Campbell", initials: "FC", title: "Education Sector Security Lead",
    bio: "Cyber security specialist for universities and FE colleges. DfE cyber standards implementer.",
    location: "Oxford", day_rate: 420, years_experience: 6, availability: "available",
    certifications: ["Cyber Essentials Plus", "ISO 27001", "GDPR Practitioner"],
    sectors: ["Higher Education", "Further Education", "Public Sector"],
    skills: ["Education Security", "DfE Standards", "JANET Security", "Student Data Protection"],
    rating: 4.1, review_count: 9, placement_count: 16, security_clearance: null,
    email: "fiona.campbell@securitycontractors.co.uk", phone: "+44 7700 900133",
    linkedin_url: "https://linkedin.com/in/fionacampbell-edusec",
    education: [
      { institution: "University of Oxford", degree: "MSc Software Engineering", year: 2018 },
      { institution: "University of Aberdeen", degree: "BSc Computing", year: 2016 }
    ],
    work_history: [
      { company: "Jisc", role: "Cyber Security Advisor", period: "2020-2023", description: "Advised universities and colleges on cyber security strategy and incident response." },
      { company: "University of Oxford", role: "IT Security Analyst", period: "2018-2020", description: "Security operations and incident response for university IT services." }
    ],
    notable_projects: [
      { name: "FE Cyber Resilience Programme", client: "Education Consortium", description: "Improved cyber resilience across 15 FE colleges including Cyber Essentials certification." }
    ],
    languages: ["English", "Scottish Gaelic"]
  },
  {
    name: "Trevor Howard", initials: "TH", title: "Emergency Services Security Consultant",
    bio: "Cyber security for police forces, fire services and ambulance trusts. ESN security specialist.",
    location: "Birmingham", day_rate: 510, years_experience: 12, availability: "unavailable",
    certifications: ["ISO 27001 Lead Auditor", "NCSC Certified Practitioner", "Cyber Essentials Plus"],
    sectors: ["Police", "Fire Service", "Ambulance"],
    skills: ["Emergency Services Security", "ESN", "ANPR Security", "Command & Control"],
    rating: 4.6, review_count: 14, placement_count: 26, security_clearance: "SC Cleared",
    email: "trevor.howard@securitycontractors.co.uk", phone: "+44 7700 900134",
    linkedin_url: "https://linkedin.com/in/trevorhoward-emergency",
    education: [
      { institution: "Birmingham City University", degree: "MSc Cyber Security", year: 2012 },
      { institution: "University of Wolverhampton", degree: "BSc Computer Networks", year: 2010 }
    ],
    work_history: [
      { company: "West Midlands Police", role: "Head of Cyber Security", period: "2017-2023", description: "Led cyber security for second-largest UK police force. Managed ANPR and command & control security." },
      { company: "Home Office", role: "ESN Security Consultant", period: "2012-2017", description: "Security architecture for Emergency Services Network programme." }
    ],
    notable_projects: [
      { name: "ESN Security Architecture", client: "Home Office", description: "Contributed to security architecture for national Emergency Services Network replacing Airwave." }
    ],
    languages: ["English"]
  },
  {
    name: "Wendy Price", initials: "WP", title: "Charity & Third Sector Security Advisor",
    bio: "Cyber security advisor for large charities and NGOs. Specialist in protecting donor data and safeguarding information.",
    location: "Manchester", day_rate: 400, years_experience: 5, availability: "available",
    certifications: ["Cyber Essentials Plus", "GDPR Practitioner", "ISO 27001"],
    sectors: ["Charity", "NGO", "Social Enterprise"],
    skills: ["Charity Security", "Donor Data Protection", "Safeguarding Data", "Cyber Essentials"],
    rating: 3.8, review_count: 7, placement_count: 12, security_clearance: null,
    email: "wendy.price@securitycontractors.co.uk", phone: "+44 7700 900135",
    linkedin_url: "https://linkedin.com/in/wendyprice-charity",
    education: [
      { institution: "University of Salford", degree: "MSc Cyber Security", year: 2019 },
      { institution: "Manchester Metropolitan University", degree: "BA Social Work", year: 2015 }
    ],
    work_history: [
      { company: "NCSC (Charity Programme)", role: "Cyber Security Advisor", period: "2021-2023", description: "NCSC-funded role advising UK charities on cyber security basics and Cyber Essentials." },
      { company: "Oxfam", role: "Information Security Officer", period: "2019-2021", description: "Information security and data protection for international NGO operations." }
    ],
    notable_projects: [
      { name: "Charity Cyber Toolkit", client: "NCSC", description: "Co-developed NCSC guidance for charity cyber security adopted by 500+ organisations." }
    ],
    languages: ["English"]
  },
];

const technologyContractors: ContractorSeed[] = [
  {
    name: "Alex Rivera", initials: "AR", title: "DevSecOps Lead",
    bio: "Integrates security into CI/CD pipelines for fast-moving tech companies. Expert in container security and infrastructure as code.",
    location: "London", day_rate: 700, years_experience: 10, availability: "available",
    certifications: ["ISO 27001", "SOC 2", "AWS Security Specialty", "CKS"],
    sectors: ["Technology", "SaaS", "Fintech"],
    skills: ["DevSecOps", "CI/CD Security", "Container Security", "IaC Security"],
    rating: 4.8, review_count: 20, placement_count: 38, security_clearance: null,
    email: "alex.rivera@securitycontractors.co.uk", phone: "+44 7700 900136",
    linkedin_url: "https://linkedin.com/in/alexrivera-devsecops",
    education: [
      { institution: "University of Cambridge", degree: "MEng Computer Science", year: 2014 },
      { institution: "University of Cambridge", degree: "BA Computer Science", year: 2013 }
    ],
    work_history: [
      { company: "Monzo", role: "Staff Security Engineer", period: "2019-2023", description: "Led security engineering for banking platform. Built security tooling for 200+ microservices." },
      { company: "ThoughtWorks", role: "Lead DevSecOps Consultant", period: "2014-2019", description: "Embedded security into delivery pipelines for enterprise clients." }
    ],
    notable_projects: [
      { name: "Security Pipeline Automation", client: "Digital Bank", description: "Built automated security scanning pipeline catching 95% of vulnerabilities before production." }
    ],
    languages: ["English", "Spanish"]
  },
  {
    name: "Jessica Wong", initials: "JW", title: "Application Security Engineer",
    bio: "AppSec engineer specialising in secure code review, SAST/DAST, and developer security training for tech companies.",
    location: "London", day_rate: 650, years_experience: 8, availability: "available",
    certifications: ["CISSP", "CSSLP", "ISO 27001"],
    sectors: ["Technology", "SaaS", "E-commerce"],
    skills: ["AppSec", "Secure Code Review", "SAST", "DAST", "Developer Training"],
    rating: 4.7, review_count: 18, placement_count: 34, security_clearance: null,
    email: "jessica.wong@securitycontractors.co.uk", phone: "+44 7700 900137",
    linkedin_url: "https://linkedin.com/in/jessicawong-appsec",
    education: [
      { institution: "Imperial College London", degree: "MSc Computing", year: 2016 },
      { institution: "University of Hong Kong", degree: "BEng Computer Science", year: 2014 }
    ],
    work_history: [
      { company: "Deliveroo", role: "Senior AppSec Engineer", period: "2020-2023", description: "Led application security programme for platform serving 8M+ customers. Built SAST/DAST pipeline." },
      { company: "Cigital (now Synopsys)", role: "Security Consultant", period: "2016-2020", description: "Secure code review and application security consulting for tech companies." }
    ],
    notable_projects: [
      { name: "Developer Security Champions", client: "Tech Unicorn", description: "Created security champions programme training 50 developers, reducing vulnerability density by 60%." }
    ],
    languages: ["English", "Cantonese", "Mandarin"]
  },
  {
    name: "Ryan O'Connor", initials: "ROC", title: "Cloud Security Architect",
    bio: "Multi-cloud security architect with expertise in AWS, Azure and GCP. Designs secure-by-default cloud landing zones.",
    location: "Manchester", day_rate: 750, years_experience: 14, availability: "available",
    certifications: ["CISSP", "AWS Security Specialty", "Azure Security Engineer", "ISO 27001 Lead Auditor"],
    sectors: ["Technology", "SaaS", "Cloud"],
    skills: ["AWS Security", "Azure Security", "GCP Security", "Cloud Architecture"],
    rating: 5.0, review_count: 27, placement_count: 52, security_clearance: null,
    email: "ryan.oconnor@securitycontractors.co.uk", phone: "+44 7700 900138",
    linkedin_url: "https://linkedin.com/in/ryanoconnor-cloud",
    education: [
      { institution: "University of Manchester", degree: "PhD Cloud Computing Security", year: 2010 },
      { institution: "Trinity College Dublin", degree: "BSc Computer Science", year: 2006 }
    ],
    work_history: [
      { company: "AWS", role: "Principal Security Architect (ProServ)", period: "2017-2023", description: "Designed secure cloud architectures for enterprise customers. Authored AWS security best practices." },
      { company: "Rackspace", role: "Senior Cloud Security Engineer", period: "2010-2017", description: "Multi-cloud security engineering for enterprise hosting clients." }
    ],
    notable_projects: [
      { name: "Secure Landing Zone", client: "FTSE 100 Company", description: "Designed multi-account AWS landing zone with automated security guardrails adopted across 200+ accounts." }
    ],
    languages: ["English", "Irish"]
  },
  {
    name: "Aisha Mohammed", initials: "AIM", title: "SOC 2 Compliance Lead",
    bio: "Has led 40+ tech companies through SOC 2 Type II certification. Streamlines compliance with automation-first approach.",
    location: "London", day_rate: 580, years_experience: 7, availability: "available",
    certifications: ["SOC 2", "ISO 27001", "CISA"],
    sectors: ["Technology", "SaaS", "Fintech"],
    skills: ["SOC 2", "Compliance Automation", "Audit", "Trust Services Criteria"],
    rating: 4.6, review_count: 23, placement_count: 42, security_clearance: null,
    email: "aisha.mohammed@securitycontractors.co.uk", phone: "+44 7700 900139",
    linkedin_url: "https://linkedin.com/in/aishamohammed-soc2",
    education: [
      { institution: "London School of Economics", degree: "MSc Management of Information Systems", year: 2017 },
      { institution: "University of Birmingham", degree: "BSc Accounting", year: 2015 }
    ],
    work_history: [
      { company: "Vanta", role: "Head of EMEA Professional Services", period: "2021-2023", description: "Led compliance advisory for 50+ SaaS companies achieving SOC 2 Type II." },
      { company: "Mazars", role: "IT Audit Manager", period: "2017-2021", description: "SOC 2 and ISAE 3402 audits for technology and financial services." }
    ],
    notable_projects: [
      { name: "Automated Compliance Platform", client: "Series C SaaS", description: "Implemented automated compliance monitoring reducing audit preparation from 3 months to 3 weeks." }
    ],
    languages: ["English", "Somali"]
  },
  {
    name: "Ben Crawford", initials: "BC", title: "Threat Intelligence Analyst",
    bio: "Cyber threat intelligence specialist for tech sector. Builds threat models and intelligence-led security programmes.",
    location: "London", day_rate: 600, years_experience: 9, availability: "within_30",
    certifications: ["CISSP", "CISM", "GIAC CTI"],
    sectors: ["Technology", "Critical Infrastructure", "Defence Tech"],
    skills: ["Threat Intelligence", "Threat Modelling", "MITRE ATT&CK", "CTI"],
    rating: 4.5, review_count: 14, placement_count: 26, security_clearance: "SC Cleared",
    email: "ben.crawford@securitycontractors.co.uk", phone: "+44 7700 900140",
    linkedin_url: "https://linkedin.com/in/bencrawford-threat",
    education: [
      { institution: "University of Lancaster", degree: "MSc Cyber Security", year: 2015 },
      { institution: "University of Newcastle", degree: "BSc Computing Science", year: 2013 }
    ],
    work_history: [
      { company: "GCHQ / NCSC", role: "Threat Intelligence Analyst", period: "2017-2023", description: "National-level threat intelligence analysis and advisory for UK critical infrastructure." },
      { company: "BAE Systems Applied Intelligence", role: "CTI Analyst", period: "2015-2017", description: "Cyber threat intelligence for government and commercial clients." }
    ],
    notable_projects: [
      { name: "Threat-Led Security Programme", client: "Tech Company", description: "Designed intelligence-led security programme using MITRE ATT&CK aligned to sector-specific threat landscape." }
    ],
    languages: ["English"]
  },
  {
    name: "Samantha Lee", initials: "SL", title: "Privacy Engineering Lead",
    bio: "Privacy engineer who builds privacy-by-design into tech products. Expert in privacy-enhancing technologies.",
    location: "London", day_rate: 620, years_experience: 8, availability: "available",
    certifications: ["CIPP/E", "CIPT", "ISO 27001"],
    sectors: ["Technology", "AdTech", "SaaS"],
    skills: ["Privacy Engineering", "Privacy by Design", "PETs", "Data Minimisation"],
    rating: 4.4, review_count: 12, placement_count: 22, security_clearance: null,
    email: "samantha.lee@securitycontractors.co.uk", phone: "+44 7700 900141",
    linkedin_url: "https://linkedin.com/in/samanthalee-privacy",
    education: [
      { institution: "University College London", degree: "MSc Information Security", year: 2016 },
      { institution: "University of Edinburgh", degree: "BSc Artificial Intelligence", year: 2014 }
    ],
    work_history: [
      { company: "Google", role: "Privacy Engineer", period: "2019-2023", description: "Privacy engineering for advertising and measurement products. Implemented differential privacy systems." },
      { company: "OneTrust", role: "Privacy Technical Consultant", period: "2016-2019", description: "Privacy programme implementation for tech company clients." }
    ],
    notable_projects: [
      { name: "Privacy-Preserving Analytics", client: "AdTech Platform", description: "Implemented privacy-preserving measurement system using differential privacy, maintaining analytical utility while protecting user privacy." }
    ],
    languages: ["English", "Mandarin"]
  },
  {
    name: "Chris Dawson", initials: "CD", title: "Red Team Operator",
    bio: "Advanced red team operator with experience in tech company adversary simulations. Cobalt Strike and custom tooling expert.",
    location: "Manchester", day_rate: 800, years_experience: 12, availability: "within_30",
    certifications: ["OSCP", "OSCE", "CREST CRT", "CISSP"],
    sectors: ["Technology", "Financial Services", "Defence Tech"],
    skills: ["Red Teaming", "Adversary Simulation", "Custom Tooling", "Physical Security"],
    rating: 4.9, review_count: 16, placement_count: 30, security_clearance: "SC Cleared",
    email: "chris.dawson@securitycontractors.co.uk", phone: "+44 7700 900142",
    linkedin_url: "https://linkedin.com/in/chrisdawson-redteam",
    education: [
      { institution: "University of Manchester", degree: "MSc Advanced Computer Science", year: 2012 },
      { institution: "University of Liverpool", degree: "BSc Computer Science", year: 2010 }
    ],
    work_history: [
      { company: "F-Secure (now WithSecure)", role: "Principal Red Team Operator", period: "2017-2023", description: "Led advanced adversary simulations for FTSE 100 companies. Developed custom C2 infrastructure and tooling." },
      { company: "MWR InfoSecurity", role: "Senior Security Consultant", period: "2012-2017", description: "Red team operations and advanced penetration testing for technology and finance." }
    ],
    notable_projects: [
      { name: "CBEST Red Team Exercise", client: "Systemically Important FI", description: "Led CBEST-style red team operation simulating nation-state threat actor over 12-week engagement." }
    ],
    languages: ["English"]
  },
  {
    name: "Maria Garcia", initials: "MG", title: "Security Product Manager",
    bio: "Product manager for security tools and platforms. Bridges gap between engineering and security teams.",
    location: "London", day_rate: 550, years_experience: 6, availability: "available",
    certifications: ["CISSP", "ISO 27001", "CSPO"],
    sectors: ["Technology", "Cybersecurity", "SaaS"],
    skills: ["Security Product Management", "Agile Security", "Security Tooling", "Roadmap"],
    rating: 4.3, review_count: 10, placement_count: 18, security_clearance: null,
    email: "maria.garcia@securitycontractors.co.uk", phone: "+44 7700 900143",
    linkedin_url: "https://linkedin.com/in/mariagarcia-secproduct",
    education: [
      { institution: "University of Oxford", degree: "MBA", year: 2018 },
      { institution: "Universidad Politecnica de Madrid", degree: "BSc Telecommunications Engineering", year: 2015 }
    ],
    work_history: [
      { company: "Darktrace", role: "Senior Product Manager", period: "2020-2023", description: "Product management for AI-driven network detection and response platform." },
      { company: "Palantir", role: "Product Manager", period: "2018-2020", description: "Security product management for government and commercial platforms." }
    ],
    notable_projects: [
      { name: "Security Platform Consolidation", client: "Enterprise SaaS", description: "Led consolidation of 8 security tools into unified platform, reducing tool sprawl and improving MTTD by 50%." }
    ],
    languages: ["English", "Spanish"]
  },
  {
    name: "Luke Patterson", initials: "LP", title: "Infrastructure Security Engineer",
    bio: "Hardens infrastructure for scale-up tech companies. Expert in network segmentation, endpoint security and EDR deployment.",
    location: "London", day_rate: 560, years_experience: 7, availability: "available",
    certifications: ["ISO 27001", "CEH", "CompTIA Security+"],
    sectors: ["Technology", "SaaS", "E-commerce"],
    skills: ["Infrastructure Security", "Network Segmentation", "EDR", "Endpoint Security"],
    rating: 4.4, review_count: 11, placement_count: 20, security_clearance: null,
    email: "luke.patterson@securitycontractors.co.uk", phone: "+44 7700 900144",
    linkedin_url: "https://linkedin.com/in/lukepatterson-infrasec",
    education: [
      { institution: "University of Southampton", degree: "MSc Computer Science", year: 2017 },
      { institution: "University of Portsmouth", degree: "BSc Computer Networks", year: 2015 }
    ],
    work_history: [
      { company: "Skyscanner", role: "Senior Infrastructure Security Engineer", period: "2020-2023", description: "Infrastructure security for travel platform. EDR deployment and network segmentation." },
      { company: "Sophos", role: "Security Engineer", period: "2017-2020", description: "Product security engineering for endpoint protection platform." }
    ],
    notable_projects: [
      { name: "Zero Trust Network Segmentation", client: "Scale-up Tech", description: "Implemented micro-segmentation reducing lateral movement attack surface by 80%." }
    ],
    languages: ["English"]
  },
  {
    name: "Hannah Davies", initials: "HD", title: "Bug Bounty & VDP Manager",
    bio: "Manages vulnerability disclosure and bug bounty programmes for tech companies. HackerOne and Bugcrowd platform expert.",
    location: "London", day_rate: 520, years_experience: 5, availability: "unavailable",
    certifications: ["CEH", "ISO 27001", "OSCP"],
    sectors: ["Technology", "SaaS", "Gaming"],
    skills: ["Bug Bounty", "VDP", "Vulnerability Management", "HackerOne"],
    rating: 4.2, review_count: 9, placement_count: 15, security_clearance: null,
    email: "hannah.davies@securitycontractors.co.uk", phone: "+44 7700 900145",
    linkedin_url: "https://linkedin.com/in/hannahdavies-bugbounty",
    education: [
      { institution: "University of Cardiff", degree: "MSc Cyber Security", year: 2019 },
      { institution: "Swansea University", degree: "BSc Computer Science", year: 2017 }
    ],
    work_history: [
      { company: "King (Activision Blizzard)", role: "Vulnerability Management Lead", period: "2021-2023", description: "Managed bug bounty and VDP for gaming platforms. Processed 500+ vulnerability reports." },
      { company: "HackerOne", role: "Triage Engineer", period: "2019-2021", description: "Triaged vulnerability reports for tech company programmes on HackerOne platform." }
    ],
    notable_projects: [
      { name: "Bug Bounty Programme Launch", client: "Gaming Company", description: "Launched public bug bounty programme that identified 45 critical vulnerabilities in first year." }
    ],
    languages: ["English", "Welsh"]
  },
  {
    name: "Nathan Blake", initials: "NB", title: "AI Security Researcher",
    bio: "Researches security implications of AI/ML systems. Expert in adversarial machine learning, model security and AI governance.",
    location: "London", day_rate: 750, years_experience: 6, availability: "available",
    certifications: ["CISSP", "ISO 27001", "ISO 42001"],
    sectors: ["Technology", "AI/ML", "Fintech"],
    skills: ["AI Security", "Adversarial ML", "Model Security", "AI Governance"],
    rating: 4.7, review_count: 8, placement_count: 14, security_clearance: null,
    email: "nathan.blake@securitycontractors.co.uk", phone: "+44 7700 900146",
    linkedin_url: "https://linkedin.com/in/nathanblake-aisec",
    education: [
      { institution: "University of Oxford", degree: "DPhil Machine Learning", year: 2018 },
      { institution: "University of Cambridge", degree: "MASt Mathematics", year: 2015 },
      { institution: "University of Warwick", degree: "BSc Mathematics", year: 2014 }
    ],
    work_history: [
      { company: "DeepMind", role: "AI Safety Researcher", period: "2020-2023", description: "Researched adversarial robustness and AI safety for production ML systems." },
      { company: "Alan Turing Institute", role: "Research Fellow", period: "2018-2020", description: "AI security and privacy research with government and industry partners." }
    ],
    notable_projects: [
      { name: "AI Security Assessment Framework", client: "Government Agency", description: "Developed comprehensive AI security assessment framework now used across UK government AI deployments." }
    ],
    languages: ["English"]
  },
  {
    name: "Victoria Cross", initials: "VC", title: "Incident Response Lead",
    bio: "Leads incident response for major tech companies. SANS certified with experience in nation-state threat response.",
    location: "Manchester", day_rate: 680, years_experience: 15, availability: "available",
    certifications: ["CISSP", "GCIH", "GREM", "ISO 27001"],
    sectors: ["Technology", "Critical Infrastructure", "SaaS"],
    skills: ["Incident Response", "Digital Forensics", "Malware Analysis", "Crisis Management"],
    rating: 4.9, review_count: 22, placement_count: 40, security_clearance: "SC Cleared",
    email: "victoria.cross@securitycontractors.co.uk", phone: "+44 7700 900147",
    linkedin_url: "https://linkedin.com/in/victoriacross-ir",
    education: [
      { institution: "Cranfield University", degree: "MSc Digital Forensics", year: 2011 },
      { institution: "University of Manchester", degree: "BSc Computer Science", year: 2009 }
    ],
    work_history: [
      { company: "CrowdStrike", role: "Director, Incident Response EMEA", period: "2018-2023", description: "Led incident response engagements for nation-state and ransomware incidents across Europe." },
      { company: "PwC", role: "Senior Manager, Cyber Incident Response", period: "2011-2018", description: "Incident response and digital forensics for major cyber incidents." }
    ],
    notable_projects: [
      { name: "Nation-State Incident Response", client: "Critical Infrastructure Provider", description: "Led 6-month incident response and recovery from nation-state compromise of critical infrastructure." }
    ],
    languages: ["English"]
  },
  {
    name: "Ethan Park", initials: "EP", title: "Blockchain Security Auditor",
    bio: "Smart contract auditor and blockchain security specialist. Has audited protocols with over $2B TVL.",
    location: "London", day_rate: 800, years_experience: 5, availability: "within_30",
    certifications: ["CISSP", "ISO 27001"],
    sectors: ["Web3", "DeFi", "Technology"],
    skills: ["Smart Contract Audit", "Blockchain Security", "Solidity", "DeFi Security"],
    rating: 4.6, review_count: 11, placement_count: 20, security_clearance: null,
    email: "ethan.park@securitycontractors.co.uk", phone: "+44 7700 900148",
    linkedin_url: "https://linkedin.com/in/ethanpark-blockchain",
    education: [
      { institution: "Imperial College London", degree: "MSc Computing (Distributed Systems)", year: 2019 },
      { institution: "KAIST", degree: "BSc Computer Science", year: 2017 }
    ],
    work_history: [
      { company: "Trail of Bits", role: "Senior Security Engineer", period: "2021-2023", description: "Smart contract auditing for major DeFi protocols. Found critical vulnerabilities in top-10 TVL projects." },
      { company: "ConsenSys Diligence", role: "Security Auditor", period: "2019-2021", description: "Ethereum smart contract security auditing and formal verification." }
    ],
    notable_projects: [
      { name: "DeFi Protocol Audit", client: "Top-10 DeFi Protocol", description: "Identified critical reentrancy vulnerability in $800M TVL lending protocol before exploit." }
    ],
    languages: ["English", "Korean"]
  },
  {
    name: "Zara Hussain", initials: "ZH", title: "Security Awareness Training Lead",
    bio: "Designs and delivers security awareness programmes for tech companies. Specialises in developer security education.",
    location: "London", day_rate: 500, years_experience: 7, availability: "available",
    certifications: ["ISO 27001", "CISSP", "CompTIA Security+"],
    sectors: ["Technology", "SaaS", "Fintech"],
    skills: ["Security Awareness", "Developer Training", "Phishing Simulation", "Culture Change"],
    rating: 4.3, review_count: 15, placement_count: 28, security_clearance: null,
    email: "zara.hussain@securitycontractors.co.uk", phone: "+44 7700 900149",
    linkedin_url: "https://linkedin.com/in/zarahussain-awareness",
    education: [
      { institution: "University of Nottingham", degree: "MSc Human Factors", year: 2017 },
      { institution: "University of Kent", degree: "BSc Psychology", year: 2015 }
    ],
    work_history: [
      { company: "Wise", role: "Security Awareness Lead", period: "2020-2023", description: "Built security awareness programme for 5,000+ employees across 17 offices." },
      { company: "KnowBe4", role: "Security Awareness Consultant", period: "2017-2020", description: "Security awareness programme design and implementation for enterprise clients." }
    ],
    notable_projects: [
      { name: "Developer Security Education", client: "Fintech", description: "Designed bespoke developer security training reducing OWASP Top 10 vulnerabilities by 45%." }
    ],
    languages: ["English", "Urdu"]
  },
  {
    name: "Oscar Grant", initials: "OG", title: "API Security Specialist",
    bio: "API security expert for tech platforms. Specialises in OAuth flows, API gateway security and microservices protection.",
    location: "Manchester", day_rate: 600, years_experience: 8, availability: "available",
    certifications: ["ISO 27001", "CISSP", "OSCP"],
    sectors: ["Technology", "SaaS", "Fintech"],
    skills: ["API Security", "OAuth", "API Gateway", "Microservices Security"],
    rating: 4.5, review_count: 13, placement_count: 24, security_clearance: null,
    email: "oscar.grant@securitycontractors.co.uk", phone: "+44 7700 900150",
    linkedin_url: "https://linkedin.com/in/oscargrant-apisec",
    education: [
      { institution: "University of Manchester", degree: "MSc Software Engineering", year: 2016 },
      { institution: "University of Leeds", degree: "BSc Computer Science", year: 2014 }
    ],
    work_history: [
      { company: "Cloudflare", role: "Senior Security Engineer (API Security)", period: "2020-2023", description: "API security product development and customer advisory for Cloudflare API Shield." },
      { company: "Akamai", role: "Security Engineer", period: "2016-2020", description: "API security and web application firewall engineering." }
    ],
    notable_projects: [
      { name: "API Security Programme", client: "Enterprise SaaS", description: "Designed comprehensive API security programme covering 500+ APIs with automated discovery and testing." }
    ],
    languages: ["English"]
  },
];

const sampleJobs = [
  {
    title: "ISO 27001 Lead Auditor - Banking Transformation",
    client_name: "Meridian Bank",
    description: "Seeking an experienced ISO 27001 Lead Auditor to guide our digital banking transformation through certification. The role involves gap analysis of current controls, designing the ISMS framework, conducting internal audits, and supporting the external certification process. Must have financial services experience and understand FCA regulatory requirements.",
    location: "London",
    remote_option: "hybrid",
    day_rate_min: 500,
    day_rate_max: 650,
    duration_weeks: 16,
    start_date: "2026-03-10",
    required_certifications: ["ISO 27001 Lead Auditor"],
    required_skills: ["ISO 27001", "FCA Compliance", "Risk Assessment", "Security Governance"],
    required_clearance: null,
    sector: "Banking",
    experience_min: 8,
    status: "open",
    urgency: "normal",
    notes: "Client prefers London-based consultant. Hybrid working 3 days on-site."
  },
  {
    title: "Penetration Testing Lead - Open Banking APIs",
    client_name: "FinConnect Ltd",
    description: "CREST-certified penetration tester needed to conduct comprehensive security assessment of our Open Banking API suite ahead of FCA authorisation. Scope includes 15 APIs, mobile app, and supporting infrastructure. Must provide detailed remediation guidance and executive summary.",
    location: "London",
    remote_option: "remote",
    day_rate_min: 600,
    day_rate_max: 750,
    duration_weeks: 4,
    start_date: "2026-03-03",
    required_certifications: ["CREST CRT", "OSCP"],
    required_skills: ["Penetration Testing", "API Security", "Web App Security"],
    required_clearance: null,
    sector: "Fintech",
    experience_min: 7,
    status: "open",
    urgency: "urgent",
    notes: "Urgent - FCA submission deadline in 6 weeks. Remote work acceptable."
  },
  {
    title: "SOC Build & Transition Manager",
    client_name: "National Health Trust Consortium",
    description: "Experienced SOC manager to design, build and operationalise a shared Security Operations Centre for a consortium of 5 NHS trusts. Includes SIEM selection and deployment, runbook development, analyst recruitment support, and 24/7 monitoring model design.",
    location: "Birmingham",
    remote_option: "hybrid",
    day_rate_min: 550,
    day_rate_max: 700,
    duration_weeks: 26,
    start_date: "2026-04-01",
    required_certifications: ["CISSP", "CISM"],
    required_skills: ["SOC", "SIEM", "Incident Response", "NHS Data Security"],
    required_clearance: "SC Cleared",
    sector: "NHS",
    experience_min: 10,
    status: "open",
    urgency: "normal",
    notes: "SC clearance required due to access to patient data systems. 6-month engagement with possible extension."
  },
  {
    title: "Cloud Security Architect - Multi-Cloud Migration",
    client_name: "TechScale Group",
    description: "Cloud security architect needed to design security controls for migration from on-premise data centres to multi-cloud (AWS and Azure). Must design landing zones, IAM strategy, network security, and data protection controls. Experience with regulated industries preferred.",
    location: "Manchester",
    remote_option: "hybrid",
    day_rate_min: 650,
    day_rate_max: 800,
    duration_weeks: 20,
    start_date: "2026-03-17",
    required_certifications: ["AWS Security Specialty", "CISSP"],
    required_skills: ["AWS Security", "Azure Security", "Cloud Architecture", "Security Architecture"],
    required_clearance: null,
    sector: "Technology",
    experience_min: 10,
    status: "open",
    urgency: "normal",
    notes: "Hybrid working from Manchester office. Must be comfortable working with DevOps teams."
  },
  {
    title: "GDPR Data Protection Officer (Interim)",
    client_name: "Atlas Insurance Group",
    description: "Interim DPO required to cover maternity leave and lead ongoing data protection programme for insurance group operating across UK and EU. Responsibilities include DPIA reviews, SAR management, regulatory liaison with ICO, and data protection training.",
    location: "London",
    remote_option: "hybrid",
    day_rate_min: 500,
    day_rate_max: 600,
    duration_weeks: 36,
    start_date: "2026-03-24",
    required_certifications: ["GDPR Practitioner", "CIPP/E"],
    required_skills: ["GDPR", "Data Protection", "Privacy Impact Assessment", "DPIA"],
    required_clearance: null,
    sector: "Insurance",
    experience_min: 8,
    status: "open",
    urgency: "normal",
    notes: "9-month cover for maternity leave. Must have insurance sector experience."
  },
  {
    title: "DevSecOps Engineer - Fintech Platform",
    client_name: "PayFlow Technologies",
    description: "DevSecOps engineer to embed security into CI/CD pipeline for payments platform processing £2B+ annually. Must implement SAST/DAST, container security scanning, and infrastructure-as-code security checks. PCI DSS awareness required.",
    location: "London",
    remote_option: "remote",
    day_rate_min: 600,
    day_rate_max: 750,
    duration_weeks: 12,
    start_date: "2026-03-10",
    required_certifications: ["ISO 27001", "AWS Security Specialty"],
    required_skills: ["DevSecOps", "CI/CD Security", "Container Security", "PCI DSS"],
    required_clearance: null,
    sector: "Fintech",
    experience_min: 7,
    status: "open",
    urgency: "urgent",
    notes: "Fully remote. Must overlap with UK business hours."
  },
  {
    title: "Cyber Security Advisor - MOD Programme",
    client_name: "Defence Digital",
    description: "Security advisor for classified MOD digital transformation programme. Requires DV clearance. Will provide security assurance for new digital services, review security architectures, and ensure compliance with JSP 440 and JSP 604.",
    location: "London",
    remote_option: "onsite",
    day_rate_min: 550,
    day_rate_max: 650,
    duration_weeks: 52,
    start_date: "2026-04-14",
    required_certifications: ["CISSP", "ISO 27001 Lead Auditor"],
    required_skills: ["Security Architecture", "Classified Systems", "JSP 440", "Defence Security"],
    required_clearance: "DV Cleared",
    sector: "MOD",
    experience_min: 12,
    status: "open",
    urgency: "low",
    notes: "12-month engagement. Full on-site required at London MOD facility. Active DV clearance essential."
  },
  {
    title: "Third Party Risk Assessment Lead",
    client_name: "Heritage Building Society",
    description: "Lead a comprehensive review of third-party risk management framework. Assess 200+ suppliers against updated PRA/FCA outsourcing requirements. Design risk-based tiering, implement ongoing monitoring, and deliver board-ready reporting.",
    location: "Bristol",
    remote_option: "hybrid",
    day_rate_min: 450,
    day_rate_max: 550,
    duration_weeks: 14,
    start_date: "2026-03-31",
    required_certifications: ["ISO 27001", "CTPRP"],
    required_skills: ["Third Party Risk", "Vendor Assessment", "Supply Chain Security", "FCA Compliance"],
    required_clearance: null,
    sector: "Building Societies",
    experience_min: 6,
    status: "open",
    urgency: "normal",
    notes: "Building society sector experience highly desirable. Bristol-based, 2 days on-site."
  },
  {
    title: "AI Security Assessment Specialist",
    client_name: "Nexus AI Labs",
    description: "AI security specialist to assess security of ML pipeline and production AI models for enterprise AI platform. Includes adversarial testing, model security review, data pipeline security, and AI governance framework development aligned with EU AI Act.",
    location: "London",
    remote_option: "hybrid",
    day_rate_min: 700,
    day_rate_max: 850,
    duration_weeks: 8,
    start_date: "2026-03-17",
    required_certifications: ["ISO 27001", "ISO 42001"],
    required_skills: ["AI Security", "Adversarial ML", "Model Security", "AI Governance"],
    required_clearance: null,
    sector: "AI/ML",
    experience_min: 5,
    status: "open",
    urgency: "urgent",
    notes: "Must have hands-on AI/ML security experience. EU AI Act knowledge essential."
  },
  {
    title: "Incident Response Retainer Lead",
    client_name: "Northern Power Grid",
    description: "Experienced incident response lead for critical national infrastructure provider. Requires SC clearance. Will establish IR retainer, develop playbooks, conduct tabletop exercises, and provide on-call major incident support.",
    location: "Leeds",
    remote_option: "hybrid",
    day_rate_min: 600,
    day_rate_max: 750,
    duration_weeks: 24,
    start_date: "2026-04-07",
    required_certifications: ["CISSP", "GCIH"],
    required_skills: ["Incident Response", "Digital Forensics", "Crisis Management", "SIEM"],
    required_clearance: "SC Cleared",
    sector: "Critical Infrastructure",
    experience_min: 10,
    status: "open",
    urgency: "normal",
    notes: "Critical national infrastructure - SC clearance mandatory. On-call element included."
  },
];

/**
 * Seeds the database with sample contractors and jobs if the tables are empty.
 * If contractors exist but lack enriched data (no email), re-seeds with full profiles.
 * Also seeds jobs if the jobs table is empty. Called by index.ts at startup.
 */
export async function seedIfEmpty(): Promise<void> {
  const existing = await pool.query("SELECT COUNT(*) as count FROM contractors");
  if (parseInt(existing.rows[0].count, 10) > 0) {
    const hasEnrichedData = await pool.query("SELECT email FROM contractors WHERE email IS NOT NULL LIMIT 1");
    if (hasEnrichedData.rows.length > 0) {
      console.log(`Database already has ${existing.rows[0].count} enriched contractors. Skipping seed.`);
    } else {
      console.log(`Updating ${existing.rows[0].count} contractors with enriched data...`);
      await pool.query("DELETE FROM contractors");
      await insertContractors();
    }
  } else {
    await insertContractors();
  }

  const jobCount = await pool.query("SELECT COUNT(*) as count FROM jobs");
  if (parseInt(jobCount.rows[0].count, 10) === 0) {
    await insertJobs();
  } else {
    console.log(`Database already has ${jobCount.rows[0].count} jobs. Skipping job seed.`);
  }
}

async function insertContractors(): Promise<void> {
  const allContractors = [...financialContractors, ...healthcareContractors, ...technologyContractors];

  for (const c of allContractors) {
    await pool.query(
      `INSERT INTO contractors (name, initials, title, bio, location, day_rate, years_experience, availability, certifications, sectors, skills, rating, review_count, placement_count, security_clearance, email, phone, linkedin_url, education, work_history, notable_projects, languages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
      [
        c.name, c.initials, c.title, c.bio, c.location, c.day_rate,
        c.years_experience, c.availability, c.certifications, c.sectors,
        c.skills, c.rating, c.review_count, c.placement_count, c.security_clearance,
        c.email, c.phone, c.linkedin_url,
        JSON.stringify(c.education), JSON.stringify(c.work_history), JSON.stringify(c.notable_projects),
        c.languages,
      ]
    );
  }

  console.log(`Seeded ${allContractors.length} enriched contractors.`);
}

async function insertJobs(): Promise<void> {
  for (const j of sampleJobs) {
    await pool.query(
      `INSERT INTO jobs (title, client_name, description, location, remote_option, day_rate_min, day_rate_max, duration_weeks, start_date, required_certifications, required_skills, required_clearance, sector, experience_min, status, urgency, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        j.title, j.client_name, j.description, j.location, j.remote_option,
        j.day_rate_min, j.day_rate_max, j.duration_weeks, j.start_date,
        j.required_certifications, j.required_skills, j.required_clearance,
        j.sector, j.experience_min, j.status, j.urgency, j.notes,
      ]
    );
  }

  console.log(`Seeded ${sampleJobs.length} jobs.`);
}

const isDirectRun = process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js");
if (isDirectRun) {
  initDatabase()
    .then(() => seedIfEmpty())
    .then(() => pool.end())
    .catch(console.error);
}
