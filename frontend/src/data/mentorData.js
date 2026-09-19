// Centralized Mock Data for Mentor Dashboard

export const mentorProfile = {
  id: "mentor_1",
  name: "Dr. Arun Kumar",
  email: "arun.kumar@university.edu",
  role: "Senior Project Mentor",
  department: "Department of AI & Data Science",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
};

export const mentorStats = {
  totalStudents: 3,
  activeProjects: 6,
  completedProjects: 4,
  completionRate: "67%",
  pendingEscalations: 2,
};

export const initialStudents = [
  {
    id: "id1",
    name: "Rahul Sharma",
    studentId: "STU001",
    email: "rahul.sharma@example.com",
    avatar: "RS",
    avatarBg: "#064e3b",
    department: "AI & Data Science",
    semester: "4th Semester",
    joined: "August 2024",
    overallProgress: 72,
    status: "Active",
    projectStatus: "On Track",
    projectsCount: 2,
    currentProject: "AI Resume Analyzer",
    currentProgress: 85,
    techStack: [
      "React",
      "Node.js",
      "Python",
      "FastAPI",
      "MongoDB",
      "PostgreSQL",
      "Git",
      "Docker",
      "OpenAI API"
    ],
    projects: [
      {
        id: "proj1",
        name: "AI Resume Analyzer",
        description:
          "An AI-powered resume analysis platform that evaluates resumes and provides improvement suggestions.",
        status: "In Progress",
        progress: 85,
        techStack: ["React", "Node.js", "Python", "FastAPI", "MongoDB", "OpenAI API"],
        startDate: "August 20, 2026",
        expectedCompletion: "October 10, 2026",
        stage: "Development", // Planning -> Development -> Testing -> Deployment
        tasksCompleted: "34 / 40",
        currentMilestone: "Model Integration",
        nextMilestone: "API Testing"
      },
      {
        id: "proj2",
        name: "Code Collaboration Platform",
        description:
          "Real-time collaborative code editor with video chat and version control integration.",
        status: "Planning",
        progress: 25,
        techStack: ["React", "Node.js", "WebSocket", "PostgreSQL"],
        startDate: "September 5, 2026",
        expectedCompletion: "November 30, 2026",
        stage: "Planning",
        tasksCompleted: "5 / 20",
        currentMilestone: "Architecture Design",
        nextMilestone: "WebSocket Setup"
      }
    ],
    activityTimeline: [
      { date: "Sep 18", text: "Completed authentication module" },
      { date: "Sep 17", text: "Integrated OpenAI API" },
      { date: "Sep 15", text: "Completed database schema" },
      { date: "Sep 12", text: "Started backend development" }
    ],
    escalationsHistory: [
      {
        id: "ESC001",
        title: "Model accuracy dropped significantly",
        priority: "HIGH",
        status: "OPEN",
        date: "Sep 18, 2026"
      },
      {
        id: "ESC002",
        title: "Database connection issue",
        priority: "MEDIUM",
        status: "RESOLVED",
        date: "Sep 15, 2026"
      }
    ]
  },
  {
    id: "id2",
    name: "Priya Reddy",
    studentId: "STU002",
    email: "priya.reddy@example.com",
    avatar: "PR",
    avatarBg: "#0284c7",
    department: "Computer Science",
    semester: "6th Semester",
    joined: "August 2023",
    overallProgress: 65,
    status: "Active",
    projectStatus: "Needs Attention",
    projectsCount: 1,
    currentProject: "Medical AI Assistant",
    currentProgress: 65,
    techStack: [
      "React",
      "Python",
      "PyTorch",
      "Flask",
      "PostgreSQL",
      "Git",
      "TailwindCSS"
    ],
    projects: [
      {
        id: "proj3",
        name: "Medical AI Assistant",
        description:
          "Diagnostic assistant helper that analyzes medical reports and highlights potential risk flags.",
        status: "In Progress",
        progress: 65,
        techStack: ["React", "Python", "PyTorch", "Flask", "PostgreSQL"],
        startDate: "July 10, 2026",
        expectedCompletion: "October 25, 2026",
        stage: "Development",
        tasksCompleted: "22 / 35",
        currentMilestone: "Symptom Parsing",
        nextMilestone: "Accuracy Testing"
      }
    ],
    activityTimeline: [
      { date: "Sep 16", text: "Submitted dataset normalization script" },
      { date: "Sep 14", text: "Trained baseline NLP model" },
      { date: "Sep 10", text: "Set up Flask backend endpoints" }
    ],
    escalationsHistory: [
      {
        id: "ESC003",
        title: "PyTorch GPU memory overflow in batch training",
        priority: "CRITICAL",
        status: "IN PROGRESS",
        date: "Sep 19, 2026"
      }
    ]
  },
  {
    id: "id3",
    name: "Arjun Kumar",
    studentId: "STU003",
    email: "arjun.kumar@example.com",
    avatar: "AK",
    avatarBg: "#7c3aed",
    department: "Information Technology",
    semester: "4th Semester",
    joined: "January 2025",
    overallProgress: 40,
    status: "Active",
    projectStatus: "On Track",
    projectsCount: 3,
    currentProject: "Smart Campus System",
    currentProgress: 40,
    techStack: [
      "React",
      "React Native",
      "Node.js",
      "Express",
      "MongoDB",
      "Python",
      "GraphQL",
      "Docker"
    ],
    projects: [
      {
        id: "proj4",
        name: "Smart Campus System",
        description:
          "IoT and Mobile dashboard for automated class attendance and campus facility booking.",
        status: "In Progress",
        progress: 40,
        techStack: ["React", "React Native", "Node.js", "Express", "MongoDB"],
        startDate: "August 1, 2026",
        expectedCompletion: "November 15, 2026",
        stage: "Development",
        tasksCompleted: "16 / 40",
        currentMilestone: "RFID Gateway Integration",
        nextMilestone: "Mobile App UI"
      },
      {
        id: "proj5",
        name: "Library Automation Bot",
        description:
          "Telegram and Web bot for book reservations and inventory tracking.",
        status: "Completed",
        progress: 100,
        techStack: ["Python", "SQLite", "Telegram API"],
        startDate: "June 1, 2026",
        expectedCompletion: "August 1, 2026",
        stage: "Deployment",
        tasksCompleted: "20 / 20",
        currentMilestone: "Deployed on Cloud",
        nextMilestone: "Maintenance"
      },
      {
        id: "proj6",
        name: "Alumni Network Portal",
        description:
          "Platform connecting university alumni with graduating students for mentorship.",
        status: "Planning",
        progress: 15,
        techStack: ["React", "GraphQL", "Node.js"],
        startDate: "September 10, 2026",
        expectedCompletion: "December 20, 2026",
        stage: "Planning",
        tasksCompleted: "3 / 25",
        currentMilestone: "Requirements Gathering",
        nextMilestone: "Wireframing"
      }
    ],
    activityTimeline: [
      { date: "Sep 19", text: "Connected RFID card reader to gateway" },
      { date: "Sep 15", text: "Created Mobile App mockup screens" },
      { date: "Sep 08", text: "Finished library bot cloud deployment" }
    ],
    escalationsHistory: []
  }
];

export const initialEscalations = [
  {
    id: "ESC001",
    studentId: "id1",
    studentName: "Rahul Sharma",
    studentCode: "STU001",
    studentEmail: "rahul@example.com",
    semester: 4,
    projectName: "AI Resume Analyzer",
    projectStatus: "In Progress",
    projectCompletion: 85,
    techStack: ["React", "Node.js", "Python", "FastAPI", "MongoDB", "OpenAI API"],
    title: "Model accuracy dropped significantly",
    priority: "HIGH", // LOW | MEDIUM | HIGH | CRITICAL
    status: "OPEN", // OPEN | IN PROGRESS | RESOLVED
    created: "18 September 2026, 10:42 AM",
    timeAgo: "2 hours ago",
    lastUpdated: "18 September 2026, 10:42 AM",
    description:
      "The classification model was initially achieving around 89% accuracy, but after adding the latest dataset the validation accuracy dropped to 64%. The student has tried retraining the model but the issue remains.",
    chatHistory: [
      {
        id: 1,
        sender: "Student",
        time: "10:12 AM",
        text: "I am getting very low validation accuracy after adding the new dataset."
      },
      {
        id: 2,
        sender: "AI Assistant",
        time: "10:13 AM",
        text: "Check whether the new dataset has class imbalance or inconsistent preprocessing."
      },
      {
        id: 3,
        sender: "Student",
        time: "10:20 AM",
        text: "I checked the preprocessing. The class distribution seems heavily skewed."
      },
      {
        id: 4,
        sender: "AI Assistant",
        time: "10:21 AM",
        text: "You may need to apply class weighting or resampling."
      },
      {
        id: 5,
        sender: "Student",
        time: "10:35 AM",
        text: "I tried class weighting but the accuracy is still low. I think I need mentor assistance."
      }
    ]
  },
  {
    id: "ESC002",
    studentId: "id1",
    studentName: "Rahul Sharma",
    studentCode: "STU001",
    studentEmail: "rahul@example.com",
    semester: 4,
    projectName: "AI Resume Analyzer",
    projectStatus: "In Progress",
    projectCompletion: 85,
    techStack: ["React", "Node.js", "Python", "FastAPI", "MongoDB", "OpenAI API"],
    title: "Database connection issue",
    priority: "MEDIUM",
    status: "RESOLVED",
    created: "15 September 2026, 03:15 PM",
    timeAgo: "3 days ago",
    lastUpdated: "15 September 2026, 05:20 PM",
    description:
      "MongoDB connection times out when running inside Docker container in production environment.",
    chatHistory: [
      {
        id: 1,
        sender: "Student",
        time: "03:15 PM",
        text: "MongoDB connection times out when deployed via Docker."
      },
      {
        id: 2,
        sender: "AI Assistant",
        time: "03:16 PM",
        text: "Verify container networking and DB host binding."
      },
      {
        id: 3,
        sender: "Mentor",
        time: "05:10 PM",
        text: "Update mongo connection string to point to host.docker.internal or container service name."
      },
      {
        id: 4,
        sender: "Student",
        time: "05:20 PM",
        text: "That solved it! Thank you mentor."
      }
    ]
  },
  {
    id: "ESC003",
    studentId: "id2",
    studentName: "Priya Reddy",
    studentCode: "STU002",
    studentEmail: "priya.reddy@example.com",
    semester: 6,
    projectName: "Medical AI Assistant",
    projectStatus: "In Progress",
    projectCompletion: 65,
    techStack: ["React", "Python", "PyTorch", "Flask", "PostgreSQL"],
    title: "PyTorch GPU memory overflow in batch training",
    priority: "CRITICAL",
    status: "IN PROGRESS",
    created: "19 September 2026, 09:30 AM",
    timeAgo: "1 day ago",
    lastUpdated: "19 September 2026, 11:00 AM",
    description:
      "Out of Memory CUDA exception occurs during batch training on medical imaging embeddings.",
    chatHistory: [
      {
        id: 1,
        sender: "Student",
        time: "09:30 AM",
        text: "CUDA Out of Memory error occurs during epoch 2 of training."
      },
      {
        id: 2,
        sender: "AI Assistant",
        time: "09:31 AM",
        text: "Try reducing batch size or clearing gradient cache with torch.cuda.empty_cache()."
      },
      {
        id: 3,
        sender: "Mentor",
        time: "11:00 AM",
        text: "Also enable gradient accumulation over smaller mini-batches to fit into memory."
      }
    ]
  }
];
