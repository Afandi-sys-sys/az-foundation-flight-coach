import type { DomainId } from "./domains";

/**
 * Original practice questions written for CloudPrep Africa, based on the public
 * AZ-900 skills outline. These are NOT real exam questions.
 */
export interface Question {
  id: string;
  domain: DomainId;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  /** Why the correct answer is right. */
  explanation: string;
  /** Why a specific wrong option is wrong, keyed by option index. */
  wrong?: Partial<Record<number, string>>;
  /** A practical, real-world example. */
  example: string;
}

export const PRACTICE_QUESTIONS: Question[] = [
  // ---------------- Cloud Concepts ----------------
  {
    id: "cc-01",
    domain: "cloud",
    topic: "Consumption-based model",
    prompt:
      "A small school in Nairobi only wants to pay for computing power while it is actually used. Which cloud benefit does this describe?",
    options: ["Consumption-based model", "Capital expenditure", "Fixed licensing", "On-premises hosting"],
    answer: 0,
    explanation:
      "With the consumption-based model you pay only for the resources you use, instead of buying hardware up front.",
    wrong: {
      1: "Capital expenditure means spending money up front on things like servers. That is the opposite of paying as you go.",
      2: "Fixed licensing charges the same amount whatever you use, so you would still pay during school holidays.",
      3: "On-premises hosting means running your own servers, which cost money even when idle.",
    },
    example:
      "The school runs its online exam portal only during term. Outside term, usage drops, and so does the bill.",
  },
  {
    id: "cc-02",
    domain: "cloud",
    topic: "Service types",
    prompt: "Which cloud service type gives you the most control over the operating system?",
    options: [
      "Software as a Service (SaaS)",
      "Platform as a Service (PaaS)",
      "Infrastructure as a Service (IaaS)",
      "Serverless",
    ],
    answer: 2,
    explanation:
      "IaaS gives you virtual machines, so you manage the operating system yourself. PaaS and SaaS hide more of it from you.",
    wrong: {
      0: "With SaaS you just use finished software. The provider manages everything underneath, including the operating system.",
      1: "With PaaS the provider manages the operating system so you can focus on your code.",
      3: "Serverless hides servers completely. You only supply code and never touch the operating system.",
    },
    example:
      "A Lagos fintech team rents a virtual machine so they can install a specific Linux version their security tools need.",
  },
  {
    id: "cc-03",
    domain: "cloud",
    topic: "Deployment models",
    prompt:
      "A bank keeps sensitive data in its own data centre but uses the public cloud for its website. What model is this?",
    options: ["Public cloud", "Hybrid cloud", "Private cloud only", "Community hosting"],
    answer: 1,
    explanation: "A hybrid cloud combines private (own) infrastructure with public cloud resources.",
    wrong: {
      0: "Public cloud alone would mean everything, including the sensitive data, runs on a provider's shared infrastructure.",
      2: "Private cloud only would mean the website also runs in the bank's own data centre.",
      3: "Community hosting is not one of the main cloud models covered in AZ-900.",
    },
    example:
      "A Kenyan bank keeps customer records on its own servers for regulatory reasons, while its marketing website runs in the public cloud.",
  },
  {
    id: "cc-04",
    domain: "cloud",
    topic: "Elasticity",
    prompt:
      "An app automatically adds more servers during a busy sale and removes them afterwards. What is this called?",
    options: ["High availability", "Disaster recovery", "Elasticity", "Governance"],
    answer: 2,
    explanation: "Elasticity means resources grow and shrink automatically to match demand.",
    wrong: {
      0: "High availability is about staying online when something fails, not about matching busy and quiet periods.",
      1: "Disaster recovery is about restoring service after a major outage.",
      3: "Governance is about rules and control, such as policies and budgets.",
    },
    example:
      "An online shop in Johannesburg handles 10 times more visitors on Black Friday, then scales back down on Monday.",
  },
  {
    id: "cc-05",
    domain: "cloud",
    topic: "Shared responsibility",
    prompt:
      "Under the shared responsibility model, which responsibility always stays with the customer, whatever the service type?",
    options: [
      "Physical security of the data centre",
      "Their own data and who can access it",
      "Patching the host operating system in SaaS",
      "Replacing faulty network cables",
    ],
    answer: 1,
    explanation:
      "Whether you use IaaS, PaaS or SaaS, you are always responsible for your data, your devices and the accounts that can access them.",
    wrong: {
      0: "The cloud provider always looks after the physical building, guards and hardware.",
      2: "In SaaS the provider patches the operating system, not the customer.",
      3: "Physical network hardware in the data centre is the provider's job.",
    },
    example:
      "Even if a clinic uses a hosted records system, the clinic must still decide which staff accounts can open patient files.",
  },
  {
    id: "cc-06",
    domain: "cloud",
    topic: "CapEx vs OpEx",
    prompt:
      "A company stops buying servers and pays a monthly cloud bill instead. How is this spending usually classified?",
    options: [
      "Operational expenditure (OpEx)",
      "Capital expenditure (CapEx)",
      "A fixed asset purchase",
      "A one-time hardware cost",
    ],
    answer: 0,
    explanation:
      "Ongoing payments for services you use are operational expenditure. You pay as you go rather than investing up front.",
    wrong: {
      1: "CapEx is money spent up front on physical things like servers, which the company has stopped doing.",
      2: "A fixed asset is something the company owns, like a server. A cloud subscription is not owned.",
      3: "A monthly bill repeats, so it is not a one-time cost.",
    },
    example:
      "A logistics startup in Kigali avoids spending a large sum on servers and instead pays a monthly amount that grows with its business.",
  },
  {
    id: "cc-07",
    domain: "cloud",
    topic: "Service types",
    prompt:
      "An NGO in Accra uses a hosted email service in a web browser and never manages any servers. Which service type is this?",
    options: [
      "Infrastructure as a Service (IaaS)",
      "Platform as a Service (PaaS)",
      "Software as a Service (SaaS)",
      "On-premises software",
    ],
    answer: 2,
    explanation: "SaaS delivers finished software over the internet. The provider manages everything else.",
    wrong: {
      0: "With IaaS the NGO would rent virtual machines and manage the operating system and email software itself.",
      1: "PaaS is for building and running your own apps, not for using finished email software.",
      3: "On-premises software would run on servers the NGO owns and maintains.",
    },
    example:
      "Field staff open their work email on any laptop or phone, and the NGO never installs updates itself.",
  },
  {
    id: "cc-08",
    domain: "cloud",
    topic: "High availability",
    prompt:
      "A mobile money app must stay usable even when some of its components fail. Which cloud benefit focuses on this?",
    options: ["High availability", "Elasticity", "Consumption-based pricing", "Governance"],
    answer: 0,
    explanation:
      "High availability means designing systems to keep running with minimal downtime, even when parts fail.",
    wrong: {
      1: "Elasticity is about adding and removing resources to match demand, not surviving failures.",
      2: "Consumption-based pricing is about how you pay, not whether the app stays online.",
      3: "Governance is about rules, policies and control over resources.",
    },
    example:
      "If one server handling payments fails, another copy takes over so customers can still send money.",
  },
  {
    id: "cc-09",
    domain: "cloud",
    topic: "Serverless",
    prompt:
      "A developer wants code to run only when a file is uploaded, with no servers to manage. What fits best?",
    options: [
      "Serverless computing",
      "A dedicated physical server",
      "A virtual machine running all day",
      "A private data centre",
    ],
    answer: 0,
    explanation:
      "Serverless computing runs code in response to events and charges only while the code runs. You never manage servers.",
    wrong: {
      1: "A physical server must be bought, set up and maintained, even when nothing is uploaded.",
      2: "A virtual machine running all day costs money while idle and still needs managing.",
      3: "A private data centre is the most hands-on option, the opposite of what the developer wants.",
    },
    example:
      "When a farmer uploads a photo of a crop, a small function resizes it automatically, then stops.",
  },
  {
    id: "cc-10",
    domain: "cloud",
    topic: "Deployment models",
    prompt: "Which statement best describes the public cloud?",
    options: [
      "Services delivered over the internet by a provider and shared by many customers",
      "Hardware used by one organisation only, in its own building",
      "A mix of your own data centre and cloud services",
      "A network with no internet access at all",
    ],
    answer: 0,
    explanation:
      "In the public cloud, a provider owns the hardware and offers services to many customers over the internet.",
    wrong: {
      1: "That describes a private cloud.",
      2: "That describes a hybrid cloud.",
      3: "Public cloud services are reached over the internet, so this is not a description of it.",
    },
    example:
      "A student in Kampala can create a website in minutes without buying any hardware, using a provider's shared infrastructure.",
  },

  // ---------------- Azure Architecture and Services ----------------
  {
    id: "ar-01",
    domain: "architecture",
    topic: "Regions",
    prompt: "What is an Azure region?",
    options: [
      "A single server rack",
      "A geographic area containing one or more data centres",
      "A billing account",
      "A user group in Microsoft Entra ID",
    ],
    answer: 1,
    explanation:
      "A region is a geographical area with one or more data centres close together, such as South Africa North.",
    wrong: {
      0: "A server rack is far smaller. A region contains whole data centres.",
      2: "Billing is handled through subscriptions and accounts, not regions.",
      3: "User groups are about identity, not geography.",
    },
    example:
      "A Cape Town company deploys its app to South Africa North so its users get faster response times.",
  },
  {
    id: "ar-02",
    domain: "architecture",
    topic: "Availability zones",
    prompt: "What are availability zones designed to protect against?",
    options: [
      "Failure of a single data centre within a region",
      "Wrong passwords",
      "High monthly costs",
      "Slow internet at home",
    ],
    answer: 0,
    explanation:
      "Availability zones are physically separate locations in a region, so one data centre failing does not take your app down.",
    wrong: {
      1: "Wrong passwords are an identity problem, handled by tools such as multi-factor authentication.",
      2: "Costs are managed with tools like budgets and the pricing calculator.",
      3: "Your home internet speed is outside Azure's control.",
    },
    example:
      "A hospital booking system runs copies in three zones. A power cut at one site does not stop patients booking.",
  },
  {
    id: "ar-03",
    domain: "architecture",
    topic: "Resource groups",
    prompt: "Which item is a logical container used to group related Azure resources?",
    options: ["Virtual network", "Resource group", "Storage blob", "Availability set"],
    answer: 1,
    explanation:
      "A resource group holds related resources so you can manage, secure and delete them together.",
    wrong: {
      0: "A virtual network connects resources privately, but it does not organise them for management.",
      2: "A blob is a single stored file, not a container for resources.",
      3: "An availability set spreads virtual machines across hardware for resilience. It does not group all kinds of resources.",
    },
    example:
      "A team puts the web app, database and storage for a school project in one resource group, then deletes it all at once when finished.",
  },
  {
    id: "ar-04",
    domain: "architecture",
    topic: "Storage",
    prompt: "A startup wants to store large amounts of photos and videos cheaply. Which service fits best?",
    options: ["Azure Blob Storage", "Azure Virtual Machines", "Azure DNS", "Azure Policy"],
    answer: 0,
    explanation: "Blob Storage is built for unstructured data such as images, video and backups.",
    wrong: {
      1: "Virtual machines provide computing power. Using their disks for large media is more expensive and harder to manage.",
      2: "Azure DNS translates domain names into addresses. It does not store files.",
      3: "Azure Policy enforces rules. It does not store data.",
    },
    example:
      "A Nigerian music app stores thousands of song files in Blob Storage and streams them to listeners.",
  },
  {
    id: "ar-05",
    domain: "architecture",
    topic: "Region pairs",
    prompt: "Why does Azure pair most regions with another region in the same geography?",
    options: [
      "To support disaster recovery and safer, staggered updates",
      "To halve your monthly bill",
      "To merge two subscriptions",
      "To speed up your home internet",
    ],
    answer: 0,
    explanation:
      "Region pairs help with disaster recovery. If a whole region has a serious problem, its pair can be used, and platform updates are rolled out to one region of a pair at a time.",
    wrong: {
      1: "Region pairs are about resilience, not discounts.",
      2: "Subscriptions are billing and access boundaries. Regions do not merge them.",
      3: "Region pairs work inside Azure and do not affect your home connection.",
    },
    example:
      "A payment company replicates its backups to a paired region so it can recover if its main region goes offline.",
  },
  {
    id: "ar-06",
    domain: "architecture",
    topic: "Networking",
    prompt: "Which service lets your Azure virtual machines communicate privately with each other?",
    options: ["Azure Virtual Network", "Azure Blob Storage", "Azure Policy", "Pricing calculator"],
    answer: 0,
    explanation:
      "Azure Virtual Network creates a private network in Azure so your resources can talk to each other securely.",
    wrong: {
      1: "Blob Storage stores files. It does not connect machines together.",
      2: "Azure Policy enforces rules on resources. It does not provide networking.",
      3: "The pricing calculator only estimates costs.",
    },
    example:
      "A web server and a database server in the same virtual network talk privately, while only the web server is reachable from the internet.",
  },
  {
    id: "ar-07",
    domain: "architecture",
    topic: "Subscriptions",
    prompt: "What is an Azure subscription mainly used for?",
    options: [
      "A billing and access boundary for resources",
      "A single virtual machine",
      "A backup file",
      "A type of storage disk",
    ],
    answer: 0,
    explanation:
      "A subscription groups resources for billing and access control. Many organisations use separate subscriptions for development and production.",
    wrong: {
      1: "A virtual machine is one resource. A subscription can contain many resources.",
      2: "A backup file is data, not an account boundary.",
      3: "Disks are resources that live inside a subscription.",
    },
    example:
      "A university gives its research department its own subscription so that department's costs appear on a separate bill.",
  },
  {
    id: "ar-08",
    domain: "architecture",
    topic: "Management groups",
    prompt:
      "A university with many subscriptions wants to apply the same rules to all of them at once. What should it use?",
    options: ["Management groups", "Tags", "Availability zones", "Blob containers"],
    answer: 0,
    explanation:
      "Management groups sit above subscriptions. Policies and access applied to a management group flow down to every subscription inside it.",
    wrong: {
      1: "Tags label resources for organisation and cost reports. They do not apply rules.",
      2: "Availability zones are about resilience within a region.",
      3: "Blob containers hold files, not subscriptions.",
    },
    example:
      "The university applies one rule at the top level: every subscription may only create resources in African regions.",
  },
  {
    id: "ar-09",
    domain: "architecture",
    topic: "Compute",
    prompt:
      "A team needs full control of a Windows server to install older accounting software. Which compute option fits?",
    options: ["Azure Virtual Machines", "Azure Functions", "Azure Blob Storage", "Azure DNS"],
    answer: 0,
    explanation:
      "Azure Virtual Machines give you a full server where you can install any software, which is ideal for older applications.",
    wrong: {
      1: "Azure Functions run small pieces of code on events. You cannot install desktop software on them.",
      2: "Blob Storage stores files. It does not run software.",
      3: "Azure DNS handles domain names, not applications.",
    },
    example:
      "A Dar es Salaam accounting firm moves its old desktop accounting system onto an Azure virtual machine instead of rewriting it.",
  },
  {
    id: "ar-10",
    domain: "architecture",
    topic: "Identity",
    prompt: "Which service manages user sign-ins and identities for Azure?",
    options: ["Microsoft Entra ID", "Azure Monitor", "Azure Files", "Azure Advisor"],
    answer: 0,
    explanation:
      "Microsoft Entra ID (formerly Azure Active Directory) is the identity service that handles users, groups and sign-in.",
    wrong: {
      1: "Azure Monitor collects metrics and logs. It does not sign users in.",
      2: "Azure Files provides shared file folders.",
      3: "Azure Advisor gives recommendations. It does not manage identities.",
    },
    example:
      "New staff at a Nairobi startup get one work account that signs them into email, the HR portal and Azure.",
  },
  {
    id: "ar-11",
    domain: "architecture",
    topic: "Storage redundancy",
    prompt: "Which storage redundancy option also keeps copies of your data in a second region?",
    options: [
      "Geo-redundant storage (GRS)",
      "Locally redundant storage (LRS)",
      "Zone-redundant storage (ZRS)",
      "A premium performance tier",
    ],
    answer: 0,
    explanation:
      "Geo-redundant storage copies data to a secondary region far away, protecting against a whole-region outage.",
    wrong: {
      1: "LRS keeps copies inside a single data centre only.",
      2: "ZRS spreads copies across zones in one region, but not to a second region.",
      3: "Performance tiers affect speed, not where copies are kept.",
    },
    example:
      "A land registry office uses GRS so property records survive even if an entire region is affected by a disaster.",
  },
  {
    id: "ar-12",
    domain: "architecture",
    topic: "Networking",
    prompt:
      "A bank needs a private connection to Azure that does not travel over the public internet. Which service fits?",
    options: ["Azure ExpressRoute", "Azure DNS", "Azure Blob Storage", "Azure Advisor"],
    answer: 0,
    explanation:
      "ExpressRoute provides a dedicated private connection between your premises and Azure, through a connectivity provider.",
    wrong: {
      1: "Azure DNS resolves names. It does not create private connections.",
      2: "Blob Storage stores files.",
      3: "Azure Advisor only gives recommendations.",
    },
    example:
      "A bank's head office connects to Azure over a private line, keeping transaction traffic off the public internet.",
  },

  // ---------------- Azure Management and Governance ----------------
  {
    id: "gv-01",
    domain: "governance",
    topic: "Azure Policy",
    prompt: "Which tool helps you enforce rules, such as only allowing resources in certain regions?",
    options: ["Azure Monitor", "Azure Policy", "Azure Advisor", "Azure Blob Storage"],
    answer: 1,
    explanation:
      "Azure Policy evaluates resources against rules you set and can block resources that do not comply.",
    wrong: {
      0: "Azure Monitor watches performance and health. It does not block resources.",
      2: "Azure Advisor suggests improvements but does not enforce rules.",
      3: "Blob Storage stores files.",
    },
    example:
      "A government agency uses a policy so data can only be stored in regions inside the country's borders.",
  },
  {
    id: "gv-02",
    domain: "governance",
    topic: "Resource locks",
    prompt: "You want to stop anyone from accidentally deleting a production database. What should you use?",
    options: ["A resource lock", "A tag", "A new region", "A public IP address"],
    answer: 0,
    explanation:
      "A delete lock (CanNotDelete) prevents a resource from being deleted until the lock is removed.",
    wrong: {
      1: "Tags are labels. They do not protect anything.",
      2: "Moving to a new region does not stop deletion.",
      3: "A public IP address is about network access, not protection from deletion.",
    },
    example:
      "An e-commerce team locks its customer database so a tired engineer cannot delete it by mistake at midnight.",
  },
  {
    id: "gv-03",
    domain: "governance",
    topic: "RBAC",
    prompt: "What does role-based access control (RBAC) let you do?",
    options: [
      "Lower the price of virtual machines",
      "Give users only the permissions they need",
      "Back up files automatically",
      "Choose a data centre",
    ],
    answer: 1,
    explanation:
      "RBAC assigns roles to users and groups so each person gets only the access needed for their job.",
    wrong: {
      0: "RBAC is about permissions, not pricing.",
      2: "Backups are handled by backup services, not RBAC.",
      3: "You choose locations through regions, not RBAC.",
    },
    example:
      "An intern gets the Reader role to view resources, while only senior engineers get permission to change them.",
  },
  {
    id: "gv-04",
    domain: "governance",
    topic: "Cost planning",
    prompt: "Which tool helps you estimate the monthly cost of Azure services before you deploy them?",
    options: ["Pricing calculator", "Resource lock", "Azure Arc", "Service Health"],
    answer: 0,
    explanation: "The pricing calculator estimates costs for the services and settings you plan to use.",
    wrong: {
      1: "A resource lock protects resources. It has nothing to do with cost estimates.",
      2: "Azure Arc extends Azure management to servers outside Azure.",
      3: "Service Health reports Azure outages and maintenance.",
    },
    example:
      "Before pitching to investors, a startup estimates how much its app will cost each month on Azure.",
  },
  {
    id: "gv-05",
    domain: "governance",
    topic: "Tags",
    prompt:
      "A finance team wants to see which department each resource belongs to in cost reports. What should be added to resources?",
    options: ["Tags", "Resource locks", "Availability zones", "Network security groups"],
    answer: 0,
    explanation:
      "Tags are name-value labels, such as department=marketing, that you can use to filter and group costs.",
    wrong: {
      1: "Locks prevent changes or deletion. They do not label departments.",
      2: "Availability zones are about resilience, not reporting.",
      3: "Network security groups filter network traffic.",
    },
    example:
      "Each resource is tagged with department=sales or department=IT, so the monthly report shows what each team spent.",
  },
  {
    id: "gv-06",
    domain: "governance",
    topic: "Azure Advisor",
    prompt: "Which service gives personalised recommendations to improve cost, security and reliability?",
    options: ["Azure Advisor", "Azure Policy", "Azure DNS", "Resource locks"],
    answer: 0,
    explanation:
      "Azure Advisor analyses your resources and suggests improvements, such as shutting down unused virtual machines.",
    wrong: {
      1: "Azure Policy enforces your rules but does not make personalised suggestions.",
      2: "Azure DNS handles domain names.",
      3: "Locks protect resources from changes.",
    },
    example:
      "Advisor notices a virtual machine that has been nearly idle for weeks and suggests a smaller, cheaper size.",
  },
  {
    id: "gv-07",
    domain: "governance",
    topic: "Service Health",
    prompt:
      "Your app is slow and you want to know whether Azure itself has a problem in your region. Where should you check?",
    options: ["Azure Service Health", "Pricing calculator", "Tags", "Azure Blob Storage"],
    answer: 0,
    explanation:
      "Azure Service Health shows outages, planned maintenance and advisories that affect the services and regions you use.",
    wrong: {
      1: "The pricing calculator estimates costs only.",
      2: "Tags are labels and do not report problems.",
      3: "Blob Storage stores files.",
    },
    example:
      "An on-call engineer checks Service Health first and sees a known networking issue in the region, saving hours of debugging.",
  },
  {
    id: "gv-08",
    domain: "governance",
    topic: "Cost management",
    prompt:
      "You want an email alert when monthly spending reaches 80% of a set amount. What should you use?",
    options: [
      "A budget in Microsoft Cost Management",
      "A resource lock",
      "Azure Arc",
      "An availability set",
    ],
    answer: 0,
    explanation:
      "Budgets in Cost Management let you set a spending limit and send alerts when costs reach thresholds you choose.",
    wrong: {
      1: "A resource lock prevents deletion or changes. It does not watch spending.",
      2: "Azure Arc manages servers outside Azure.",
      3: "Availability sets improve virtual machine resilience.",
    },
    example:
      "A student club sets a small monthly budget and gets an email warning before their free credit runs out.",
  },
  {
    id: "gv-09",
    domain: "governance",
    topic: "Azure Arc",
    prompt:
      "A company wants to manage servers in its own data centre using Azure tools. Which service helps?",
    options: ["Azure Arc", "Azure Blob Storage", "Pricing calculator", "Availability zones"],
    answer: 0,
    explanation:
      "Azure Arc extends Azure management, such as policies and monitoring, to servers running outside Azure.",
    wrong: {
      1: "Blob Storage stores files.",
      2: "The pricing calculator only estimates costs.",
      3: "Availability zones are Azure locations, not a way to manage your own servers.",
    },
    example:
      "A mining company manages servers at a remote site and in Azure from one place, applying the same rules to both.",
  },
  {
    id: "gv-10",
    domain: "governance",
    topic: "Monitoring",
    prompt: "Which service collects metrics and logs so you can watch the health of your apps and resources?",
    options: ["Azure Monitor", "Resource locks", "Tags", "Pricing calculator"],
    answer: 0,
    explanation:
      "Azure Monitor collects and analyses metrics and logs, and can send alerts when something looks wrong.",
    wrong: {
      1: "Locks protect resources from deletion or changes.",
      2: "Tags are labels for organising resources.",
      3: "The pricing calculator only estimates costs.",
    },
    example:
      "An alert fires when a ticket-booking website's response time jumps, so the team can fix it before a big match.",
  },
];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  PRACTICE_QUESTIONS.map((q) => [q.id, q]),
);
