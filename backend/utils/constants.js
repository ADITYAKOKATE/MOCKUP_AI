const EXAMS = {
    "GATE": "GATE",
    "JEE_MAIN": "JEE Main",
    "JEE_ADVANCED": "JEE Advanced",
    "NEET": "NEET",
    "MHT_CET": "MHT CET"
};

const BRANCHES = {
    "CS": "Computer Science and Information Technology",
    "DA": "Data Science and Artificial Intelligence",
    "EC": "Electronics and Communication Engineering",
    "EE": "Electrical Engineering",
    "ME": "Mechanical Engineering",
    "CE": "Civil Engineering",
    "IN": "Instrumentation Engineering",
    "CH": "Chemical Engineering",
    "BT": "Biotechnology"
};

const METADATA = {
    "GATE": {
        "CS": {
            "Algorithms": [
                "Complexity Analysis And Asymptotic Notations",
                "Divide And Conquer Method",
                "Dynamic Programming",
                "Greedy Method",
                "P And Np Concepts",
                "Searching And Sorting"
            ],
            "Compiler Design": [
                "Code Generation And Optimization",
                "Lexical Analysis",
                "Parsing",
                "Syntax Directed Translation"
            ],
            "Computer Networks": [
                "Application Layer Protocol",
                "Concepts Of Layering",
                "Data Link Layer And Switching",
                "Lan Technologies And Wi Fi",
                "Network Layer",
                "Network Security",
                "Routing Algorithm",
                "Tcp Udp Sockets And Congestion Control"
            ],
            "Computer Organization": [
                "Alu Data Path And Control Unit",
                "Computer Arithmetic",
                "Io Interface",
                "Machine Instructions And Addressing Modes",
                "Memory Interfacing",
                "Pipelining",
                "Secondary Memory"
            ],
            "Data Structures": [
                "Arrays",
                "Graphs",
                "Hashing",
                "Linked List",
                "Stacks And Queues",
                "Trees"
            ],
            "Database Management System": [
                "Er Diagrams",
                "File Structures And Indexing",
                "Functional Dependencies And Normalization",
                "Relational Algebra",
                "Structured Query Language",
                "Transactions And Concurrency"
            ],
            "Digital Logic": [
                "Boolean Algebra",
                "Combinational Circuits",
                "K Maps",
                "Number Systems",
                "Sequential Circuits"
            ],
            "Discrete Mathematics": [
                "Calculus",
                "Combinatorics",
                "Graph Theory",
                "Linear Algebra",
                "Mathematical Logic",
                "Probability",
                "Set Theory And Algebra"
            ],
            "General Aptitude": [
                "Logical Reasoning",
                "Numerical Ability",
                "Verbal Ability"
            ],
            "Operating Systems": [
                "Deadlocks",
                "File System Io And Protection",
                "Memory Management",
                "Process Concepts And Cpu Scheduling",
                "Synchronization And Concurrency"
            ],
            "Programming Languages": [
                "Basic Of Programming Language",
                "Function And Recursion",
                "Pointer And Structure In C"
            ],
            "Software Engineering": [
                "Software Engineering"
            ],
            "Theory Of Computation": [
                "Finite Automata And Regular Language",
                "Push Down Automata And Context Free Language",
                "Recursively Enumerable Language And Turing Machine",
                "Undecidability"
            ],
            "Web Technologies": [
                "Web Technologies"
            ]
        },
        "DA": {
            "Algorithms": [
                "Complexity Analysis And Asymptotic Notations",
                "Greedy Method",
                "Searching And Sorting"
            ],
            "Artificial Intelligence": [
                "Artificial Intelligence"
            ],
            "Data Structures": [
                "Hashing"
            ],
            "Database Management System And Warehousing": [
                "Functional Dependencies And Normalization",
                "Relational Algebra",
                "Structured Query Language"
            ],
            "Discrete Mathematics": [
                "Calculus",
                "Graph Theory",
                "Linear Algebra",
                "Mathematical Logic",
                "Probability"
            ],
            "General Aptitude": [
                "Logical Reasoning",
                "Numerical Ability",
                "Verbal Ability"
            ],
            "Machine Learning": [
                "Machine Learning"
            ],
            "Python Programming": [
                "Python Programming"
            ]
        },
        "EC": {
            "Analog Circuits": [
                "555 Timer",
                "Bipolar Junction Transistor",
                "Diodes",
                "Feedback Amplifier",
                "Fet And Mosfet",
                "Frequency Response",
                "Operational Amplifier",
                "Oscillators",
                "Power Amplifier"
            ],
            "Communications": [
                "Analog Communication Systems",
                "Digital Communication Systems",
                "Fundamentals Of Information Theory",
                "Noise In Digital Communication",
                "Random Signals And Noise"
            ],
            "Control Systems": [
                "Basic Of Control Systems",
                "Compensators",
                "Frequency Response Analysis",
                "Root Locus Diagram",
                "Signal Flow Graph And Block Diagram",
                "Stability",
                "State Space Analysis",
                "Time Response Analysis"
            ],
            "Digital Circuits": [
                "Analog To Digital And Digital To Analog Converters",
                "Boolean Algebra",
                "Combinational Circuits",
                "Logic Families",
                "Logic Gates",
                "Number System And Code Convertions",
                "Semiconductor Memories",
                "Sequential Circuits"
            ],
            "Electromagnetics": [
                "Antennas",
                "Maxwell Equations",
                "Miscellaneous",
                "Transmission Lines",
                "Uniform Plane Waves",
                "Waveguides"
            ],
            "Electronic Devices And Vlsi": [
                "Bjt And Fet",
                "Ic Basics And Mosfet",
                "Pn Junction",
                "Semiconductor Physics"
            ],
            "Engineering Mathematics": [
                "Calculus",
                "Complex Variable",
                "Differential Equations",
                "Linear Algebra",
                "Numerical Methods",
                "Probability And Statistics",
                "Transform Theory",
                "Vector Calculus"
            ],
            "General Aptitude": [
                "Logical Reasoning",
                "Numerical Ability",
                "Verbal Ability"
            ],
            "Microprocessors": [
                "Instruction Set And Programming With 8085",
                "Pin Details Of 8085 And Interfacing With 8085"
            ],
            "Network Theory": [
                "Miscellaneous",
                "Network Elements",
                "Network Graphs",
                "Network Theorems",
                "Sinusoidal Steady State Response",
                "State Equations For Networks",
                "Transient Response",
                "Two Port Networks"
            ],
            "Signals And Systems": [
                "Continuous Time Linear Invariant System",
                "Continuous Time Signal Laplace Transform",
                "Discrete Fourier Transform And Fast Fourier Transform",
                "Discrete Time Linear Time Invariant Systems",
                "Discrete Time Signal Fourier Series Fourier Transform",
                "Discrete Time Signal Z Transform",
                "Fourier Transform",
                "Miscellaneous",
                "Representation Of Continuous Time Signal Fourier Series",
                "Sampling",
                "Transmission Of Signal Through Continuous Time Lti Systems",
                "Transmission Of Signal Through Discrete Time Lti Systems"
            ]
        },
        "EE": {
            "Analog Electronics": [
                "555 Timer",
                "Bjt And Mosfet Biasing",
                "Diode Circuits And Applications",
                "Feedback Amplifiers And Oscillator Circuits",
                "Frequency Response",
                "Operational Amplifier",
                "Small Signal Modeling"
            ],
            "Control Systems": [
                "Basics Of Control System",
                "Block Diagram And Signal Flow Graph",
                "Controller And Compensator",
                "Polar Nyquist And Bode Plot",
                "Root Locus Techniques",
                "Routh Hurwitz Stability",
                "State Variable Analysis",
                "Time Response Analysis"
            ],
            "Digital Electronics": [
                "Analog To Digital And Digital To Analog Converter",
                "Boolean Algebra",
                "Combinational Circuits",
                "Logic Families And Memories",
                "Logic Gates",
                "Microprocessor",
                "Minimization",
                "Sequential Circuits"
            ],
            "Electric Circuits": [
                "Graph Theory",
                "Network Elements",
                "Network Theorems",
                "Sinusoidal Steady State Analysis",
                "Three Phase Circuits",
                "Transient Response",
                "Two Port Networks"
            ],
            "Electrical And Electronics Measurement": [
                "Basic Of Indicating Instruments",
                "Cathode Ray Oscilloscope",
                "Digital Voltmeters Questions",
                "Error Analysis And Measurement",
                "Measurement Of Energy And Power",
                "Measurement Of Resistance And Ac Bridges",
                "Potentiometer And Instrument Transformers"
            ],
            "Electrical Machines": [
                "Dc Machines",
                "Induction Machines",
                "Synchronous Machines",
                "Transformers"
            ],
            "Electromagnetic Fields": [
                "Electrostatics",
                "Magnetostatics",
                "Time Varying Fields"
            ],
            "Engineering Mathematics": [
                "Calculus",
                "Complex Variable",
                "Differential Equations",
                "Linear Algebra",
                "Numerical Methods",
                "Probability And Statistics",
                "Transform Theory",
                "Vector Calculus"
            ],
            "General Aptitude": [
                "Logical Reasoning",
                "Numerical Ability",
                "Verbal Ability"
            ],
            "Power Electronics": [
                "Ac Voltage Controllers",
                "Choppers And Commutation Techniques",
                "Inverters",
                "Power Semiconductor Devices",
                "Single And Three Phase Rectifier"
            ],
            "Power System Analysis": [
                "Circuit Breaker",
                "Generating Power Station",
                "High Voltage Dc Transmission",
                "Load Flow Studies",
                "Parameters And Performance Of Transmission Lines",
                "Per Unit System",
                "Power Generation Cost",
                "Power System Stability",
                "Switch Gear And Protection",
                "Symmetrical Components And Symmetrical And Unsymmetrical Faults"
            ],
            "Signals And Systems": [
                "Continuous And Discrete Time Signals",
                "Continuous Time Periodic Signal Fourier Series",
                "Continuous Time Signal Fourier Transform",
                "Continuous Time Signal Laplace Transform",
                "Discrete Time Signal Z Transformation",
                "Linear Time Invariant Systems",
                "Miscellaneous",
                "Sampling Theorem"
            ]
        },
        "ME": {
            "Engineering Mathematics": [
                "Calculus",
                "Complex Variable",
                "Differential Equations",
                "Linear Algebra",
                "Numerical Methods",
                "Probability And Statistics",
                "Transform Theory",
                "Vector Calculus"
            ],
            "Engineering Mechanics": [
                "Engineering Mechanics Static And Dynamics"
            ],
            "Fluid Mechanics": [
                "Boundary Layer",
                "Fluid Dynamics",
                "Fluid Kinematics",
                "Fluid Properties",
                "Fluid Statics",
                "Laminar Flow",
                "Turbulent Flow"
            ],
            "General Aptitude": [
                "Logical Reasoning",
                "Numerical Ability",
                "Verbal Ability"
            ],
            "Heat Transfer": [
                "Conduction",
                "Convection",
                "Fin Design And Transient Heat Conduction",
                "Heat Exchangers",
                "Radiation"
            ],
            "Industrial Engineering": [
                "Assignment",
                "Forecasting",
                "Inventory Control",
                "Line Balancing",
                "Linear Programming",
                "Pert And Cpm",
                "Production Planning And Control",
                "Queuing",
                "Scheduling",
                "Transportation"
            ],
            "Machine Design": [
                "Bolted Riveted And Welded Joints",
                "Design For Static Loading",
                "Design Of Bearings",
                "Design Of Brakes And Clutches",
                "Design Of Spur Gears",
                "Fatigue Strength"
            ],
            "Production Engineering": [
                "Advance Machine Tools",
                "Casting",
                "Machining",
                "Metal Cutting",
                "Metal Forming",
                "Metrology And Inspection",
                "Sheet Metal Forming Processes",
                "Welding Process"
            ],
            "Strength Of Materials": [
                "Columns And Struts",
                "Complex Stresses",
                "Deflection Of Beams",
                "Moment Of Inertia",
                "Pure Bending",
                "Shear Force And Bending Moment",
                "Simple Stress And Strain",
                "Springs",
                "Strain Energy Method",
                "Stresses In Beams",
                "Thin Cylinders",
                "Torsion"
            ],
            "Theory Of Machines": [
                "Analysis Of Plane Mechanisms",
                "Flywheel",
                "Gears And Gear Trains",
                "Vibrations"
            ],
            "Thermodynamics": [
                "Availability",
                "Basic Concepts And Zeroth Law",
                "Calculation Of Work And Heat",
                "Entropy And Irreversibility",
                "First Law Of Thermodynamics",
                "Properties Of Pure Substances",
                "Rankine Cycle",
                "Second Law Of Thermodynamics"
            ],
            "Turbo Machinery": [
                "Turbo Machinery"
            ]
        },
        "CE": {
            "Construction Material And Management": [
                "Construction Materials",
                "Critical Path Method",
                "Program Evolution Review Technique"
            ],
            "Engineering Mathematics": [
                "Calculus",
                "Complex Variable",
                "Differential Equations",
                "Linear Algebra",
                "Numerical Methods",
                "Probability And Statistics",
                "Transform Theory",
                "Vector Calculus"
            ],
            "Engineering Mechanics": [
                "Equilibrium Of Force Systems",
                "Work Energy Principle And Impulse Momentum Equation"
            ],
            "Environmental Engineering": [
                "Air Pollution",
                "Disposal Of Sewage Effluent",
                "Noise Pollution",
                "Quality Control Of Water",
                "Sewage System And Sewer Appurtenances",
                "Solid Waste Management",
                "Sources And Coveyances Water",
                "Treatment Of Sewage",
                "Treatment Of Water",
                "Waste Water Characteristics",
                "Water Demand"
            ],
            "Fluid Mechanics And Hydraulic Machines": [
                "Boundary Layer Theory",
                "Dimensional Analysis",
                "Drag And Lift",
                "Flow Through Pipes",
                "Fluid Dynamics",
                "Fluid Pressure And Measurement",
                "Fluid Statics",
                "Hydraulic Machines",
                "Hydrostatic Forces",
                "Open Channel Flow",
                "Properties Of Fluids"
            ],
            "General Aptitude": [
                "Logical Reasoning",
                "Numerical Ability",
                "Verbal Ability"
            ],
            "Geomatics Engineering Or Surveying": [
                "Angular Measurements And Compass Survey",
                "Basic Concepts",
                "Basics Of Gis Gps And Remote Sensing",
                "Curves",
                "Field Astronomy And Photogrammetric Surveying",
                "Levelling",
                "Linear Measurements And Chain Survey",
                "Measurement Of Area Volume And Theory Of Errors And Survey Adjustment",
                "Theodolites And Plane Table Surveying",
                "Traversing"
            ],
            "Geotechnical Engineering": [
                "Classification Of Soils And Clay Mineralogy",
                "Compaction Of Soil",
                "Compressibility And Consolidation",
                "Definitions And Properties Of Soils",
                "Effective Stress And Permeability",
                "Origin Of Soils",
                "Pile Foundation",
                "Retaining Wall And Earth Pressure",
                "Seepage Analysis",
                "Shallow Foundation",
                "Shear Strength Of Soil",
                "Soil Stabilization",
                "Stability Of Slopes",
                "Stress Distribution Of Soil"
            ],
            "Hydrology": [
                "Evaporation And Transpiration",
                "Flood Estimation And Flood Routing",
                "Hydrograph",
                "Infiltration",
                "Precipitation And Frequency Of Rainfall Data",
                "Well Hydraulics And River Gauging"
            ],
            "Irrigation": [
                "Gravity Dams And Spillways",
                "Water Requirement Of Crops"
            ],
            "Reinforced Cement Concrete": [
                "Bond",
                "Doubly Reinforced Sections",
                "Flanged Beams",
                "Footings",
                "Limit State Of Collapse Compression",
                "Limit State Of Collapse Shear",
                "Limit State Of Collapse Torsion",
                "Limit State Of Serviceability",
                "Prestressed Concrete",
                "Singly Reinforced Sections",
                "Slabs",
                "Workmenship And Fundamentals"
            ],
            "Steel Structures": [
                "Beams",
                "Compression Members",
                "Eccentric Connections",
                "Materials And Specifications",
                "Plate Girder",
                "Riveted Joints And Bolted Joints",
                "Tension Members",
                "Welded Connections"
            ],
            "Strength Of Materials Or Solid Mechanics": [
                "Centroid And Moment Of Inertia",
                "Columns And Struts",
                "Complex Stress",
                "Deflection Of Beams",
                "Propped Cantilever Beam",
                "Pure Bending",
                "Shear Force And Bending Moment",
                "Shear Stress In Beams",
                "Simple Stresses",
                "Strain Energy Method",
                "Thin Cylinder",
                "Torsion"
            ],
            "Structural Analysis": [
                "Arches And Cable",
                "Energy Principle",
                "Indeterminacy",
                "Influence Line Diagram",
                "Matrix Method",
                "Methods Of Analysis",
                "Moment Distribution Method",
                "Plastic Analysis",
                "Slope Deflection Method",
                "Stability And Static Indeterminacy",
                "Truss"
            ],
            "Transportation Engineering": [
                "Highway Devolopment And Planning",
                "Highway Geometric Design",
                "Highway Materials",
                "Pavement Design",
                "Railway Runway And Taxiway Design",
                "Traffic Engineering"
            ]
        }
    },
    "JEE_MAIN": {
        "Chemistry": [
            "Alcohols Phenols And Ethers",
            "Aldehydes Ketones And Carboxylic Acids",
            "Basics Of Organic Chemistry",
            "Biomolecules",
            "Chemical Bonding And Molecular Structure",
            "Chemical Equilibrium",
            "Chemical Kinetics And Nuclear Chemistry",
            "Chemistry In Everyday Life",
            "Compounds Containing Nitrogen",
            "Coordination Compounds",
            "D And F Block Elements",
            "Electrochemistry",
            "Environmental Chemistry",
            "Gaseous State",
            "Haloalkanes And Haloarenes",
            "Hydrocarbons",
            "Hydrogen",
            "Ionic Equilibrium",
            "Isolation Of Elements",
            "P Block Elements",
            "Periodic Table And Periodicity",
            "Polymers",
            "Practical Organic Chemistry",
            "Redox Reactions",
            "S Block Elements",
            "Salt Analysis",
            "Solid State",
            "Solutions",
            "Some Basic Concepts Of Chemistry",
            "Structure Of Atom",
            "Surface Chemistry",
            "Thermodynamics"
        ],
        "Mathematics": [
            "3d Geometry",
            "Application Of Derivatives",
            "Area Under The Curves",
            "Binomial Theorem",
            "Circle",
            "Complex Numbers",
            "Definite Integration",
            "Differential Equations",
            "Differentiation",
            "Ellipse",
            "Functions",
            "Height And Distance",
            "Hyperbola",
            "Indefinite Integrals",
            "Inverse Trigonometric Functions",
            "Limits Continuity And Differentiability",
            "Logarithm",
            "Mathematical Induction",
            "Mathematical Reasoning",
            "Matrices And Determinants",
            "Parabola",
            "Permutations And Combinations",
            "Probability",
            "Properties Of Triangle",
            "Quadratic Equation And Inequalities",
            "Sequences And Series",
            "Sets And Relations",
            "Statistics",
            "Straight Lines And Pair Of Straight Lines",
            "Trigonometric Functions And Equations",
            "Trigonometric Ratio And Identites",
            "Vector Algebra"
        ],
        "Physics": [
            "Alternating Current",
            "Atoms And Nuclei",
            "Capacitor",
            "Center Of Mass",
            "Circular Motion",
            "Communication Systems",
            "Current Electricity",
            "Dual Nature Of Radiation",
            "Electromagnetic Induction",
            "Electromagnetic Waves",
            "Electronic Devices",
            "Electrostatics",
            "Geometrical Optics",
            "Gravitation",
            "Heat And Thermodynamics",
            "Laws Of Motion",
            "Magnetic Properties Of Matter",
            "Magnetics",
            "Motion In A Plane",
            "Motion In A Straight Line",
            "Properties Of Matter",
            "Rotational Motion",
            "Simple Harmonic Motion",
            "Units And Measurements",
            "Vector Algebra",
            "Wave Optics",
            "Waves",
            "Work Power And Energy"
        ]
    },
    "JEE_ADVANCED": {
        "Chemistry": [
            "Alcohols Phenols And Ethers",
            "Aldehydes Ketones And Carboxylic Acids",
            "Basics Of Organic Chemistry",
            "Biomolecules",
            "Chemical Bonding And Molecular Structure",
            "Chemical Equilibrium",
            "Chemical Kinetics And Nuclear Chemistry",
            "Chemistry In Everyday Life",
            "Compounds Containing Nitrogen",
            "Coordination Compounds",
            "D And F Block Elements",
            "Electrochemistry",
            "Gaseous State",
            "Haloalkanes And Haloarenes",
            "Hydrocarbons",
            "Hydrogen",
            "Ionic Equilibrium",
            "Isolation Of Elements",
            "P Block Elements",
            "Periodic Table And Periodicity",
            "Polymers",
            "Practical Organic Chemistry",
            "Redox Reactions",
            "S Block Elements",
            "Salt Analysis",
            "Solid State",
            "Solutions",
            "Some Basic Concepts Of Chemistry",
            "Structure Of Atom",
            "Surface Chemistry",
            "Thermodynamics"
        ],
        "Mathematics": [
            "3d Geometry",
            "Application Of Derivatives",
            "Application Of Integration",
            "Circle",
            "Complex Numbers",
            "Definite Integration",
            "Differential Equations",
            "Differentiation",
            "Ellipse",
            "Functions",
            "Hyperbola",
            "Indefinite Integrals",
            "Inverse Trigonometric Functions",
            "Limits Continuity And Differentiability",
            "Mathematical Induction And Binomial Theorem",
            "Matrices And Determinants",
            "Parabola",
            "Permutations And Combinations",
            "Probability",
            "Properties Of Triangle",
            "Quadratic Equation And Inequalities",
            "Sequences And Series",
            "Statistics",
            "Straight Lines And Pair Of Straight Lines",
            "Trigonometric Functions And Equations",
            "Vector Algebra"
        ],
        "Physics": [
            "Alternating Current",
            "Atoms And Nuclei",
            "Capacitor",
            "Current Electricity",
            "Dual Nature Of Radiation",
            "Electromagnetic Induction",
            "Electromagnetic Waves",
            "Electrostatics",
            "Geometrical Optics",
            "Gravitation",
            "Heat And Thermodynamics",
            "Impulse And Momentum",
            "Laws Of Motion",
            "Magnetism",
            "Motion",
            "Properties Of Matter",
            "Rotational Motion",
            "Simple Harmonic Motion",
            "Units And Measurements",
            "Wave Optics",
            "Waves",
            "Work Power And Energy"
        ]
    },
    "NEET": {
        "Biology": [
            "Anatomy Of Flowering Plants",
            "Animal Kingdom",
            "Biodiversity And Conservation",
            "Biological Classification",
            "Biomolecules",
            "Biotechnology And Its Applications",
            "Biotechnology Principles And Processes",
            "Body Fluids And Its Circulation",
            "Breathing And Exchange Of Gases",
            "Cell Cycle And Cell Division",
            "Cell The Unit Of Life",
            "Chemical Coordination And Integration",
            "Digestion And Absorption",
            "Ecosystem",
            "Environmental Issues",
            "Evolution",
            "Excretory Products And Their Elimination",
            "Human Health And Diseases",
            "Human Reproduction",
            "Locomotion And Movement",
            "Microbes In Human Welfare",
            "Mineral Nutrition",
            "Molecular Basis Of Inheritance",
            "Morphology Of Flowering Plants",
            "Neural Control And Coordination",
            "Organisms And Populations",
            "Photosynthesis In Higher Plants",
            "Plant Growth And Development",
            "Plant Kingdom",
            "Principles Of Inheritance And Variation",
            "Reproduction In Organisms",
            "Reproductive Health",
            "Respiration In Plants",
            "Sexual Reproduction In Flowering Plants",
            "Strategies For Enhancement In Food Production",
            "Structural Organisation In Animals",
            "The Living World",
            "Transport In Plants"
        ],
        "Chemistry": [
            "Alcohol Phenols And Ethers",
            "Aldehydes Ketones And Carboxylic Acids",
            "Biomolecules",
            "Chemical Bonding And Molecular Structure",
            "Chemical Equilibrium",
            "Chemical Kinetics",
            "Chemistry In Everyday Life",
            "Coordination Compounds",
            "D And F Block Elements",
            "Electrochemistry",
            "Environmental Chemistry",
            "Gaseous State",
            "Haloalkanes And Haloarenes",
            "Hydrocarbons",
            "Hydrogen",
            "Ionic Equilibrum",
            "Nuclear Chemistry",
            "Organic Compounds Containing Nitrogen",
            "P Block Elements",
            "Periodic Table And Periodicity",
            "Polymers",
            "Processes Of Isolation Of Elements",
            "Redox Reactions",
            "S Block Elements",
            "Solid State",
            "Solutions",
            "Some Basic Concepts Of Chemistry",
            "Some Basic Concepts Of Organic Chemistry",
            "Structure Of Atom",
            "Surface Chemistry",
            "Thermodynamics"
        ],
        "Physics": [
            "Alternating Current",
            "Atoms And Nuclei",
            "Capacitor",
            "Center Of Mass And Collision",
            "Current Electricity",
            "Dual Nature Of Radiation And Matter",
            "Electromagnetic Induction",
            "Electromagnetic Waves",
            "Electrostatics",
            "Geometrical Optics",
            "Gravitation",
            "Heat And Thermodynamics",
            "Laws Of Motion",
            "Magnetism And Matter",
            "Motion In A Plane",
            "Motion In A Straight Line",
            "Moving Charges And Magnetism",
            "Oscillations",
            "Properties Of Matter",
            "Rotational Motion",
            "Semiconductor Electronics",
            "Units And Measurement",
            "Wave Optics",
            "Waves",
            "Work Energy And Power"
        ]
    },
    "MHT_CET": {
        "Chemistry": [
            "Alcohol Phenols And Ethers",
            "Aldehyde And Ketone",
            "Atomic Structure",
            "Biomolecules",
            "Carboxylic Acids And Its Derivatives",
            "Chemical Bonding And Molecular Structure",
            "Chemical Equilibrium",
            "Chemical Kinetics",
            "Chemistry In Everyday Life",
            "Compounds Containing Nitrogen",
            "Coordination Compounds",
            "D And F Block Elements",
            "Electrochemistry",
            "Environmental Chemistry",
            "General Organic Chemistry",
            "Haloalkanes And Haloarenes",
            "Hydrocarbons",
            "Hydrogen And Its Compounds",
            "Ionic Equilibrum",
            "Isomerism",
            "Iupac Nomenclature",
            "Liquid Solution",
            "Metallurgy",
            "Nuclear Chemistry",
            "P Block Elements",
            "Periodic Table And Periodicity",
            "Polymers",
            "Practical Organic Chemistry",
            "Redox Reactions",
            "S Block Elements",
            "Solid State",
            "Some Basic Concepts Of Chemistry",
            "States Of Matter",
            "Surface Chemistry",
            "Thermodynamics"
        ],
        "Mathematics": [
            "Application Of Derivatives",
            "Area Under The Curves",
            "Binomial Theorem",
            "Circle",
            "Complex Numbers",
            "Definite Integration",
            "Differential Equations",
            "Differentiation",
            "Ellipse",
            "Functions",
            "Hyperbola",
            "Indefinite Integration",
            "Inverse Trigonometric Functions",
            "Limits Continuity And Differentiability",
            "Linear Programming",
            "Logarithms",
            "Mathematical Reasoning",
            "Matrices And Determinants",
            "Parabola",
            "Permutations And Combinations",
            "Probability",
            "Properties Of Triangles",
            "Quadratic Equations",
            "Sequences And Series",
            "Sets And Relations",
            "Statistics",
            "Straight Lines And Pair Of Straight Lines",
            "Three Dimensional Geometry",
            "Trigonometric Equations",
            "Trigonometric Ratios And Identities",
            "Vector Algebra"
        ],
        "Physics": [
            "Alternating Current",
            "Atoms And Nuclei",
            "Capacitor",
            "Center Of Mass",
            "Circular Motion",
            "Communication Systems",
            "Current Electricity",
            "Dual Nature Of Radiation",
            "Elasticity",
            "Electromagnetic Induction",
            "Electromagnetic Waves",
            "Electrostatics",
            "Fluid Mechanics",
            "Gravitation",
            "Heat And Thermodynamics",
            "Laws Of Motion",
            "Magnetism And Matter",
            "Motion",
            "Moving Charges And Magnetism",
            "Ray Optics",
            "Rotational Motion",
            "Semiconductor Devices And Logic Gates",
            "Simple Harmonic Motion",
            "Units And Measurement And Dimensions",
            "Vector Algebra",
            "Wave Optics",
            "Waves",
            "Work Energy And Power"
        ]
    }
};

module.exports = { EXAMS, BRANCHES, METADATA };

// Helper Functions to replace examStructure.js

/**
 * Get the structure for a specific exam
 * @param {string} examName - Name of the exam (e.g. "JEE Main", "GATE")
 * @returns {Object|null} Subject-topic mapping
 */
function getExamStructure(examName) {
    // 1. Find key for simple exams
    const key = Object.keys(EXAMS).find(k => EXAMS[k] === examName);

    if (key) {
        if (key === 'GATE') return METADATA['GATE']['CS']; // Default to CS for generic GATE
        return METADATA[key];
    }

    // 2. Handle aliases/variations
    const nameUpper = examName.toUpperCase();
    const nameNormalized = nameUpper.replace(/-/g, '_').replace(/ /g, '_'); // "JEE-MAIN" -> "JEE_MAIN"

    if (nameUpper === 'GATE CSE' || nameUpper === 'GATE CS' || nameUpper === 'GATE-CS') return METADATA['GATE']['CS'];
    if (nameNormalized.includes('GATE')) {
        // Extract branch if possible
        const branch = Object.keys(METADATA.GATE).find(b => nameNormalized.includes(b));
        if (branch) return METADATA.GATE[branch];
    }

    // Direct lookup in METADATA keys (JEE_MAIN, JEE_ADVANCED, MHT_CET)
    if (METADATA[nameNormalized]) return METADATA[nameNormalized];

    // Manual mapping fallback
    if (nameNormalized === 'JEE_MAIN') return METADATA['JEE_MAIN'];
    if (nameNormalized === 'JEE_ADVANCED') return METADATA['JEE_ADVANCED'];
    if (nameNormalized === 'MHT_CET') return METADATA['MHT_CET'];

    return null;
}

/**
 * Get all available exam names
 */
function getAvailableExams() {
    return Object.values(EXAMS);
}

/**
 * Check if an exam exists
 */
function examExists(examName) {
    // Check direct values or supported aliases
    const inExams = Object.values(EXAMS).includes(examName);
    if (inExams) return true;

    // Check GATE aliases
    if (examName && examName.startsWith('GATE ')) return true;

    return false;
}

/**
 * Get all subjects for a specific exam
 */
function getExamSubjects(examName) {
    const structure = getExamStructure(examName);
    return structure ? Object.keys(structure) : [];
}

/**
 * Get all topics for a specific subject in an exam
 */
function getSubjectTopics(examName, subject) {
    const structure = getExamStructure(examName);
    return structure && structure[subject] ? structure[subject] : [];
}

module.exports = {
    EXAMS,
    BRANCHES,
    METADATA,
    getExamStructure,
    getAvailableExams,
    examExists,
    getExamSubjects,
    getSubjectTopics
};
