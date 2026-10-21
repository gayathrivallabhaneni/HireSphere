"""
Seed realistic demonstration data for Multi-Vendor Job Board.
Creates Admin, Recruiters, Companies, Candidates, Resumes, Jobs, Applications, and Audit History.
"""
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from companies.models import Company, RecruiterProfile
from candidates.models import CandidateProfile, Resume
from jobs.models import Job
from applications.models import JobApplication, ApplicationStatusHistory, RecruiterNote

User = get_user_model()

# Minimal valid PDF file content
DUMMY_PDF_BYTES = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 44 >> stream
BT /F1 12 Tf 100 700 Td (Candidate Verified Resume) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000210 00000 n 
trailer << /Root 1 0 R /Size 5 >>
startxref
305
%%EOF
"""

class Command(BaseCommand):
    help = 'Seeds database with realistic multi-vendor job board sample data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Beginning database seeding..."))

        # 1. Superuser / Admin
        admin_user, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'username': 'admin@example.com',
                'first_name': 'Eleanor',
                'last_name': 'Vance',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'phone_number': '+1 (555) 019-2831'
            }
        )
        if created:
            admin_user.set_password('AdminPass123!')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("[OK] Admin user created: admin@example.com / AdminPass123!"))
        else:
            self.stdout.write("Admin user already exists.")

        # 2. Companies
        companies_data = [
            {
                'name': 'Acme Cloud Systems',
                'industry': 'Cloud Infrastructure & DevOps',
                'location': 'San Francisco, CA',
                'website': 'https://acmecloud.example.com',
                'size': '51-200',
                'description': 'Acme Cloud Systems provides high-resilience multi-cloud management platforms and edge computing orchestration for global enterprise customers.',
                'is_verified': True,
            },
            {
                'name': 'TechNova AI',
                'industry': 'Artificial Intelligence & Machine Learning',
                'location': 'New York, NY',
                'website': 'https://technova.example.com',
                'size': '201-500',
                'description': 'TechNova AI is pioneering generative models, autonomous code review agents, and intelligent enterprise semantic search pipelines.',
                'is_verified': True,
            },
            {
                'name': 'Pulse Health Technologies',
                'industry': 'Digital Health & Biotech',
                'location': 'Boston, MA',
                'website': 'https://pulsehealth.example.com',
                'size': '11-50',
                'description': 'Pulse Health connects hospitals, clinical researchers, and telemedicine patients through HIPAA-compliant real-time monitoring devices.',
                'is_verified': True,
            },
            {
                'name': 'Nordic FinTech Solutions',
                'industry': 'Financial Technology',
                'location': 'Austin, TX',
                'website': 'https://nordicfin.example.com',
                'size': '501-1000',
                'description': 'Next-generation cross-border payment gateway and algorithmic fraud prevention platforms for European and North American merchants.',
                'is_verified': False,
            }
        ]

        companies = {}
        for c_data in companies_data:
            comp, _ = Company.objects.get_or_create(
                name=c_data['name'],
                defaults=c_data
            )
            companies[comp.name] = comp
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(companies)} companies configured."))

        # 3. Recruiters
        recruiters_info = [
            {
                'email': 'recruiter1@acme.com',
                'first_name': 'Marcus',
                'last_name': 'Brody',
                'company': companies['Acme Cloud Systems'],
                'title': 'Head of Engineering Talent',
                'phone': '+1 (555) 234-5678',
                'is_admin': True,
            },
            {
                'email': 'recruiter2@technova.com',
                'first_name': 'Elena',
                'last_name': 'Rostova',
                'company': companies['TechNova AI'],
                'title': 'Director of People Operations',
                'phone': '+1 (555) 345-6789',
                'is_admin': True,
            },
            {
                'email': 'recruiter3@pulse.io',
                'first_name': 'Julian',
                'last_name': 'Sterling',
                'company': companies['Pulse Health Technologies'],
                'title': 'Technical Recruiter',
                'phone': '+1 (555) 456-7890',
                'is_admin': True,
            }
        ]

        recruiter_users = []
        for r_info in recruiters_info:
            r_user, r_created = User.objects.get_or_create(
                email=r_info['email'],
                defaults={
                    'username': r_info['email'],
                    'first_name': r_info['first_name'],
                    'last_name': r_info['last_name'],
                    'role': User.Role.RECRUITER,
                    'phone_number': r_info['phone']
                }
            )
            if r_created:
                r_user.set_password('RecruiterPass123!')
                r_user.save()

            RecruiterProfile.objects.get_or_create(
                user=r_user,
                defaults={
                    'company': r_info['company'],
                    'title': r_info['title'],
                    'is_company_admin': r_info['is_admin']
                }
            )
            recruiter_users.append(r_user)
        self.stdout.write(self.style.SUCCESS("[OK] Recruiters configured: recruiter1@acme.com, recruiter2@technova.com, recruiter3@pulse.io / RecruiterPass123!"))

        # 4. Candidates
        candidates_info = [
            {
                'email': 'candidate1@example.com',
                'first_name': 'Alex',
                'last_name': 'Rivera',
                'phone': '+1 (555) 678-1234',
                'headline': 'Senior Full-Stack Engineer | React, Django & Cloud Architecture',
                'skills': ['React.js', 'Python', 'Django', 'PostgreSQL', 'Docker', 'TypeScript', 'Tailwind CSS', 'AWS'],
                'experience_years': 6,
                'location': 'San Francisco, CA',
                'preferred_location': 'Remote / San Francisco',
                'preferred_employment_type': 'FULL_TIME',
                'salary_expectation': '$155,000 - $180,000',
                'summary': 'Full-stack software engineer with 6+ years building scalable SaaS web platforms and high-throughput REST APIs. Passionate about clean code, robust test suites, and delightful developer experiences.',
                'education': 'B.S. in Computer Science - UC Berkeley (2018)',
                'github_url': 'https://github.com/alexrivera-demo',
                'linkedin_url': 'https://linkedin.com/in/alexrivera-demo',
                'portfolio_url': 'https://alexrivera.dev',
                'resume_title': 'Alex_Rivera_FullStack_2026.pdf',
            },
            {
                'email': 'candidate2@example.com',
                'first_name': 'Sarah',
                'last_name': 'Chen',
                'phone': '+1 (555) 789-2345',
                'headline': 'Lead Product Designer & UX Researcher',
                'skills': ['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Prototyping', 'Tailwind CSS', 'Information Architecture'],
                'experience_years': 7,
                'location': 'New York, NY',
                'preferred_location': 'New York, NY / Hybrid',
                'preferred_employment_type': 'FULL_TIME',
                'salary_expectation': '$145,000 - $170,000',
                'summary': 'Product designer specializing in enterprise workflows, complex B2B dashboards, and scalable design systems. Proven record reducing task completion time by 40% across SaaS products.',
                'education': 'B.F.A. in Interaction Design - School of Visual Arts (2017)',
                'github_url': '',
                'linkedin_url': 'https://linkedin.com/in/sarahchen-demo',
                'portfolio_url': 'https://sarahchen.design',
                'resume_title': 'Sarah_Chen_Product_Design_2026.pdf',
            },
            {
                'email': 'candidate3@example.com',
                'first_name': 'David',
                'last_name': 'Miller',
                'phone': '+1 (555) 890-3456',
                'headline': 'DevOps & Site Reliability Engineer | Kubernetes & Terraform',
                'skills': ['Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Python', 'AWS', 'Prometheus', 'Linux'],
                'experience_years': 4,
                'location': 'Austin, TX',
                'preferred_location': 'Remote',
                'preferred_employment_type': 'FULL_TIME',
                'salary_expectation': '$135,000 - $160,000',
                'summary': 'Site Reliability Engineer focused on automated infrastructure-as-code, zero-downtime deployments, and distributed systems observability.',
                'education': 'B.S. in Information Technology - University of Texas at Austin (2020)',
                'github_url': 'https://github.com/davidmiller-demo',
                'linkedin_url': 'https://linkedin.com/in/davidmiller-demo',
                'portfolio_url': '',
                'resume_title': 'David_Miller_SRE_Resume_2026.pdf',
            }
        ]

        candidate_users = []
        candidate_resumes = {}
        for cand in candidates_info:
            c_user, c_created = User.objects.get_or_create(
                email=cand['email'],
                defaults={
                    'username': cand['email'],
                    'first_name': cand['first_name'],
                    'last_name': cand['last_name'],
                    'role': User.Role.CANDIDATE,
                    'phone_number': cand['phone']
                }
            )
            if c_created:
                c_user.set_password('CandidatePass123!')
                c_user.save()

            CandidateProfile.objects.update_or_create(
                user=c_user,
                defaults={
                    'headline': cand['headline'],
                    'summary': cand['summary'],
                    'skills': cand['skills'],
                    'experience_years': cand['experience_years'],
                    'location': cand['location'],
                    'preferred_location': cand['preferred_location'],
                    'preferred_employment_type': cand['preferred_employment_type'],
                    'salary_expectation': cand['salary_expectation'],
                    'education': cand['education'],
                    'github_url': cand['github_url'],
                    'linkedin_url': cand['linkedin_url'],
                    'portfolio_url': cand['portfolio_url']
                }
            )

            # Create realistic valid resume
            resume, _ = Resume.objects.get_or_create(
                user=c_user,
                title=cand['resume_title'].replace('.pdf', ''),
                defaults={
                    'original_filename': cand['resume_title'],
                    'file_size': len(DUMMY_PDF_BYTES),
                    'file_type': 'application/pdf',
                    'is_primary': True
                }
            )
            if not resume.file:
                resume.file.save(cand['resume_title'], ContentFile(DUMMY_PDF_BYTES), save=True)

            candidate_users.append(c_user)
            candidate_resumes[c_user.email] = resume

        self.stdout.write(self.style.SUCCESS("[OK] Candidates configured: candidate1@example.com, candidate2@example.com, candidate3@example.com / CandidatePass123!"))

        # 5. Job Openings
        jobs_data = [
            {
                'company': companies['Acme Cloud Systems'],
                'recruiter': recruiter_users[0],
                'title': 'Senior Full-Stack Engineer (React & Django)',
                'location': 'San Francisco, CA',
                'work_mode': Job.WorkMode.HYBRID,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'experience_level': Job.ExperienceLevel.SENIOR,
                'min_salary': 150000,
                'max_salary': 185000,
                'status': Job.Status.PUBLISHED,
                'is_featured': True,
                'skills': ['React.js', 'Python', 'Django', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
                'description': 'We are looking for a Senior Full-Stack Engineer to lead the architecture and implementation of our next-generation cloud infrastructure orchestration dashboard.',
                'responsibilities': '- Architect and implement reusable, high-performance React components with Tailwind CSS.\n- Design resilient RESTful APIs in Django REST Framework with comprehensive test coverage.\n- Optimize PostgreSQL queries and database schemas for sub-100ms response times.\n- Collaborate with product designers and platform engineers to define feature roadmaps.',
                'requirements': '- 5+ years of experience with Python/Django and modern React.\n- Deep understanding of relational databases, indexing, and query optimization.\n- Hands-on experience with containerization (Docker) and CI/CD pipelines.\n- Excellent written and verbal technical communication skills.',
                'closing_date': (timezone.now() + timedelta(days=45)).date()
            },
            {
                'company': companies['Acme Cloud Systems'],
                'recruiter': recruiter_users[0],
                'title': 'Cloud DevOps / Infrastructure Engineer',
                'location': 'Remote (US)',
                'work_mode': Job.WorkMode.REMOTE,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'experience_level': Job.ExperienceLevel.MID,
                'min_salary': 130000,
                'max_salary': 160000,
                'status': Job.Status.PUBLISHED,
                'is_featured': False,
                'skills': ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'Prometheus', 'CI/CD'],
                'description': 'Join Acme Cloud Systems to automate and scale multi-region Kubernetes clusters supporting millions of daily API transactions.',
                'responsibilities': '- Maintain and evolve our Kubernetes clusters across AWS and GCP.\n- Implement infrastructure-as-code using Terraform and GitOps.\n- Build self-healing monitoring and automated incident response workflows.\n- Partner with application engineers on deployment pipelines and performance profiling.',
                'requirements': '- 3+ years experience managing production Kubernetes workloads.\n- Strong proficiency in Terraform and cloud networking (VPC, peering, load balancers).\n- Experience with Prometheus, Grafana, and OpenTelemetry observability stacks.',
                'closing_date': (timezone.now() + timedelta(days=30)).date()
            },
            {
                'company': companies['TechNova AI'],
                'recruiter': recruiter_users[1],
                'title': 'Lead AI Research Engineer',
                'location': 'New York, NY',
                'work_mode': Job.WorkMode.HYBRID,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'experience_level': Job.ExperienceLevel.LEAD,
                'min_salary': 190000,
                'max_salary': 240000,
                'status': Job.Status.PUBLISHED,
                'is_featured': True,
                'skills': ['Python', 'PyTorch', 'LLMs', 'Vector Databases', 'Transformers', 'FastAPI'],
                'description': 'TechNova AI is hiring a Lead AI Research Engineer to spearhead our autonomous agent reasoning engine and semantic code search framework.',
                'responsibilities': '- Lead experiments on domain-specific fine-tuning and evaluation of large language models.\n- Build ultra-low latency embedding retrieval pipelines using vector databases.\n- Design evaluation benchmarks measuring code synthesis accuracy and reasoning safety.\n- Mentor junior researchers and collaborate with software engineering teams.',
                'requirements': '- M.S. or Ph.D. in Computer Science, Machine Learning, or related quantitative field.\n- Demonstrated publications or production experience with transformers and generative models.\n- Strong systems engineering skills in Python, PyTorch, and distributed training.',
                'closing_date': (timezone.now() + timedelta(days=60)).date()
            },
            {
                'company': companies['TechNova AI'],
                'recruiter': recruiter_users[1],
                'title': 'Senior Frontend Engineer (Design Systems)',
                'location': 'New York, NY',
                'work_mode': Job.WorkMode.HYBRID,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'experience_level': Job.ExperienceLevel.SENIOR,
                'min_salary': 155000,
                'max_salary': 180000,
                'status': Job.Status.PUBLISHED,
                'is_featured': False,
                'skills': ['React.js', 'TypeScript', 'Tailwind CSS', 'Figma', 'Accessibility', 'Vite'],
                'description': 'Help craft the visual and interactive foundation of our flagship AI assistant and developer platform.',
                'responsibilities': '- Develop and maintain our enterprise design system and accessible UI component library.\n- Collaborate closely with product designers to implement pixel-perfect micro-interactions.\n- Ensure WCAG AA accessibility compliance across all web products.\n- Profile and optimize client-side rendering performance for streaming responses.',
                'requirements': '- 5+ years of dedicated frontend engineering experience with React.\n- Mastery of modern CSS, Tailwind, and design token architectures.\n- Deep empathy for end-user experience, ergonomics, and accessibility.',
                'closing_date': (timezone.now() + timedelta(days=25)).date()
            },
            {
                'company': companies['Pulse Health Technologies'],
                'recruiter': recruiter_users[2],
                'title': 'Backend Python Engineer (Healthcare APIs)',
                'location': 'Boston, MA',
                'work_mode': Job.WorkMode.REMOTE,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'experience_level': Job.ExperienceLevel.MID,
                'min_salary': 125000,
                'max_salary': 150000,
                'status': Job.Status.PUBLISHED,
                'is_featured': True,
                'skills': ['Python', 'Django', 'PostgreSQL', 'Redis', 'FHIR', 'HIPAA'],
                'description': 'Develop secure, compliant APIs that bridge hospital EHR systems with real-time patient biometric monitors.',
                'responsibilities': '- Implement robust Django REST Framework endpoints processing high-velocity patient vitals.\n- Ensure strict compliance with HIPAA, SOC2, and data encryption standards.\n- Maintain real-time WebSocket pipelines for hospital telemetry stations.\n- Write extensive unit and integration tests for mission-critical endpoints.',
                'requirements': '- 3+ years backend Python development experience.\n- Familiarity with healthcare standards (FHIR, HL7) is a strong plus.\n- Strong understanding of database transactions and data security best practices.',
                'closing_date': (timezone.now() + timedelta(days=40)).date()
            },
            {
                'company': companies['Pulse Health Technologies'],
                'recruiter': recruiter_users[2],
                'title': 'Junior QA & Test Automation Specialist',
                'location': 'Boston, MA',
                'work_mode': Job.WorkMode.ON_SITE,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'experience_level': Job.ExperienceLevel.ENTRY,
                'min_salary': 80000,
                'max_salary': 100000,
                'status': Job.Status.PUBLISHED,
                'is_featured': False,
                'skills': ['Python', 'Pytest', 'Playwright', 'Postman', 'Git', 'CI/CD'],
                'description': 'Kickstart your career validating medical-grade web applications through comprehensive test automation.',
                'responsibilities': '- Build end-to-end regression test suites with Playwright and Pytest.\n- Perform exploratory testing on new features and document clear reproduction steps.\n- Integrate automated tests into GitHub Actions workflows.',
                'requirements': '- Degree in Computer Science or demonstrable test automation portfolio.\n- Working knowledge of Python and browser developer tools.\n- Passion for high software quality and meticulous attention to detail.',
                'closing_date': (timezone.now() + timedelta(days=15)).date()
            },
            {
                'company': companies['Acme Cloud Systems'],
                'recruiter': recruiter_users[0],
                'title': 'Product Manager - Cloud Analytics (Draft)',
                'location': 'San Francisco, CA',
                'work_mode': Job.WorkMode.HYBRID,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'experience_level': Job.ExperienceLevel.SENIOR,
                'min_salary': 160000,
                'max_salary': 195000,
                'status': Job.Status.DRAFT,
                'is_featured': False,
                'skills': ['Product Management', 'Data Analytics', 'SaaS', 'SQL'],
                'description': 'Upcoming job opening for cloud analytics leadership.',
                'responsibilities': '- Define product vision and quarterly OKRs.\n- Conduct customer discovery interviews with enterprise CTOs.',
                'requirements': '- 4+ years B2B product management experience.',
                'closing_date': None
            }
        ]

        created_jobs = []
        for j_data in jobs_data:
            job, _ = Job.objects.get_or_create(
                company=j_data['company'],
                title=j_data['title'],
                defaults=j_data
            )
            created_jobs.append(job)
        self.stdout.write(self.style.SUCCESS(f"[OK] {len(created_jobs)} jobs seeded."))

        # 6. Applications with Status History & Recruiter Notes
        applications_plan = [
            # Candidate 1 applied to Acme Senior Full Stack (Shortlisted)
            {
                'job': created_jobs[0], # Acme Senior Full-Stack
                'candidate': candidate_users[0],
                'resume': candidate_resumes['candidate1@example.com'],
                'cover_letter': 'Dear Acme Cloud Systems Team,\n\nI was thrilled to see your opening for a Senior Full-Stack Engineer. Having spent the last 6 years building data-dense React dashboards backed by Django and PostgreSQL, I have tackled many of the exact challenges outlined in your posting.\n\nI look forward to discussing how my background can contribute to your team!',
                'status': JobApplication.Status.SHORTLISTED,
                'history': [
                    ('NONE', JobApplication.Status.APPLIED, candidate_users[0], 'Candidate submitted application online.'),
                    (JobApplication.Status.APPLIED, JobApplication.Status.UNDER_REVIEW, recruiter_users[0], 'Profile matches criteria. Forwarding to hiring team.'),
                    (JobApplication.Status.UNDER_REVIEW, JobApplication.Status.SHORTLISTED, recruiter_users[0], 'Resume and GitHub portfolio look outstanding. Shortlisted for initial screening.')
                ],
                'notes': [
                    (recruiter_users[0], 'Strong candidate. Berkeley CS graduate with solid React/Django portfolio. Scheduled to review with lead architect.')
                ]
            },
            # Candidate 1 applied to Pulse Health Backend Python (Interview Scheduled)
            {
                'job': created_jobs[4], # Pulse Backend Python
                'candidate': candidate_users[0],
                'resume': candidate_resumes['candidate1@example.com'],
                'cover_letter': 'I have extensive experience designing secure REST APIs with Django and PostgreSQL, adhering to rigorous compliance standards.',
                'status': JobApplication.Status.INTERVIEW_SCHEDULED,
                'history': [
                    ('NONE', JobApplication.Status.APPLIED, candidate_users[0], 'Application submitted.'),
                    (JobApplication.Status.APPLIED, JobApplication.Status.UNDER_REVIEW, recruiter_users[2], 'Reviewed candidate background.'),
                    (JobApplication.Status.UNDER_REVIEW, JobApplication.Status.INTERVIEW_SCHEDULED, recruiter_users[2], 'Technical screening interview confirmed for next Tuesday.')
                ],
                'notes': [
                    (recruiter_users[2], 'Passed initial phone screen with flying colors. Deep knowledge of Django transactions and API design.')
                ]
            },
            # Candidate 2 applied to TechNova Frontend Design Systems (Offered!)
            {
                'job': created_jobs[3], # TechNova Design Systems
                'candidate': candidate_users[1],
                'resume': candidate_resumes['candidate2@example.com'],
                'cover_letter': 'Hello Elena and TechNova team,\n\nWith 7 years crafting design systems and accessible React component libraries, I love bridging the gap between design and high-grade frontend implementation.\n\nBest regards,\nSarah Chen',
                'status': JobApplication.Status.OFFERED,
                'history': [
                    ('NONE', JobApplication.Status.APPLIED, candidate_users[1], 'Application submitted.'),
                    (JobApplication.Status.APPLIED, JobApplication.Status.SHORTLISTED, recruiter_users[1], 'Portfolio is top-tier.'),
                    (JobApplication.Status.SHORTLISTED, JobApplication.Status.INTERVIEW_SCHEDULED, recruiter_users[1], 'Full-loop interviews completed with positive feedback across all rounds.'),
                    (JobApplication.Status.INTERVIEW_SCHEDULED, JobApplication.Status.OFFERED, recruiter_users[1], 'Offer package extended: $175,000 base + equity.')
                ],
                'notes': [
                    (recruiter_users[1], 'Unanimous hire recommendation from the engineering and design panels. Candidate considering offer.')
                ]
            },
            # Candidate 3 applied to Acme DevOps (Under Review)
            {
                'job': created_jobs[1], # Acme DevOps
                'candidate': candidate_users[2],
                'resume': candidate_resumes['candidate3@example.com'],
                'cover_letter': 'Excited to apply for the DevOps role at Acme. I manage Kubernetes clusters and Terraform infrastructure daily in my current role.',
                'status': JobApplication.Status.UNDER_REVIEW,
                'history': [
                    ('NONE', JobApplication.Status.APPLIED, candidate_users[2], 'Application submitted.'),
                    (JobApplication.Status.APPLIED, JobApplication.Status.UNDER_REVIEW, recruiter_users[0], 'Recruiter reviewing candidate Kubernetes experience.')
                ],
                'notes': [
                    (recruiter_users[0], 'Has good Terraform and Kubernetes experience. Checking on production incident response depth.')
                ]
            }
        ]

        for app_info in applications_plan:
            app, app_created = JobApplication.objects.get_or_create(
                job=app_info['job'],
                candidate=app_info['candidate'],
                defaults={
                    'resume': app_info['resume'],
                    'cover_letter': app_info['cover_letter'],
                    'status': app_info['status']
                }
            )

            # Update job applications count
            app_info['job'].applications_count = app_info['job'].applications.count()
            app_info['job'].save()

            if app_created:
                for from_st, to_st, ch_user, comment in app_info['history']:
                    ApplicationStatusHistory.objects.create(
                        application=app,
                        from_status=from_st,
                        to_status=to_st,
                        changed_by=ch_user,
                        notes=comment
                    )

                for note_recruiter, note_text in app_info['notes']:
                    RecruiterNote.objects.create(
                        application=app,
                        recruiter=note_recruiter,
                        note=note_text
                    )

        self.stdout.write(self.style.SUCCESS("[OK] Applications, status audit trails, and private recruiter notes seeded."))
        self.stdout.write(self.style.SUCCESS("\nDatabase seeding completed successfully! All sample accounts are ready to use."))
