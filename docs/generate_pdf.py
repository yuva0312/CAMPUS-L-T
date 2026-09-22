import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def build_pdf():
    docs_dir = os.path.dirname(os.path.abspath(__file__))
    output_pdf = os.path.join(docs_dir, 'REQUIREMENTS_SPECIFICATION.pdf')
    
    doc = SimpleDocTemplate(
        output_pdf,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e293b'),
        alignment=1, # Center
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#6366f1'),
        alignment=1,
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#4338ca'),
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#1e293b')
    )

    story = []

    # Title Banner
    story.append(Paragraph("AI-Based College Campus Lost & Found System", title_style))
    story.append(Paragraph("Software Requirements Specification (SRS) & Module Architecture", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#6366f1'), spaceAfter=15))

    # Section 1: System Overview
    story.append(Paragraph("1. System Architecture Overview", h1_style))
    story.append(Paragraph("The system is designed using a 3-tier microservices architecture ensuring high scalability, modularity, and real-time responsiveness:", body_style))
    
    arch_data = [
        [Paragraph("Tier / Module", table_header_style), Paragraph("Technology Stack", table_header_style), Paragraph("Port", table_header_style), Paragraph("Primary Responsibilities", table_header_style)],
        [Paragraph("Frontend UI", table_body_style), Paragraph("React 19, Vite 8, React Router 7, Axios, Glassmorphism CSS", table_body_style), Paragraph("5173", table_body_style), Paragraph("Single Page App UI, student portal, admin dashboard & forms", table_body_style)],
        [Paragraph("Backend REST API", table_body_style), Paragraph("Node.js, Express.js, Mongoose 8, JWT, Bcrypt.js, CORS", table_body_style), Paragraph("5000", table_body_style), Paragraph("Authentication, business logic, DB storage, inter-service API calls", table_body_style)],
        [Paragraph("AI Microservice", table_body_style), Paragraph("Python FastAPI, Sentence Transformers (all-MiniLM-L6-v2)", table_body_style), Paragraph("8000", table_body_style), Paragraph("384-D text embeddings, cosine similarity & keyword boosting", table_body_style)],
        [Paragraph("Database", table_body_style), Paragraph("MongoDB Server Community Edition (v6.0+)", table_body_style), Paragraph("27017", table_body_style), Paragraph("Persistent storage for Users, Lost Items, Found Items, Claims, Notifications", table_body_style)]
    ]

    arch_table = Table(arch_data, colWidths=[90, 150, 45, 255])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4f46e5')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 12))

    # Section 2: Core Functional Modules
    story.append(Paragraph("2. Module Specifications & Functional Requirements", h1_style))

    # FR-1
    story.append(Paragraph("FR-1: Authentication & User Management Module", h2_style))
    story.append(Paragraph("• <b>Student Registration</b>: Collects Name, Student Register ID, College Email, Phone Number, Department, and Academic Year.", bullet_style))
    story.append(Paragraph("• <b>Password Security</b>: 10-round salted Bcrypt password hashing prior to persistence.", bullet_style))
    story.append(Paragraph("• <b>Session Authorization</b>: JWT token issued on login and attached via Bearer headers for protected endpoints.", bullet_style))
    story.append(Paragraph("• <b>Role-Based Access</b>: Segregates Student privileges from Administrative Verification Staff.", bullet_style))

    # FR-2
    story.append(Paragraph("FR-2: Lost & Found Item Reporting Module", h2_style))
    story.append(Paragraph("• <b>Lost Item Registration</b>: Captures item name, category, location, room, date/time, time range, brand, color, unique marks, special features, damage, and private description.", bullet_style))
    story.append(Paragraph("• <b>Found Item Logging</b>: Enables campus members to log found items while preserving privacy.", bullet_style))

    # FR-3
    story.append(Paragraph("FR-3: AI Semantic Matching Engine Module", h2_style))
    story.append(Paragraph("• <b>NLP Embeddings</b>: Converts item descriptions into 384-dimensional dense vectors using <i>all-MiniLM-L6-v2</i>.", bullet_style))
    story.append(Paragraph("• <b>Cosine Similarity Calculation</b>: Evaluates semantic distance between lost and candidate found items.", bullet_style))
    story.append(Paragraph("• <b>Keyword Boosting & Scoring</b>: Outputs a 0–100% Match Score and categorizes as High Potential, Possible, or Low Similarity.", bullet_style))

    # FR-4
    story.append(Paragraph("FR-4: Privacy Protection & Redaction Module", h2_style))
    story.append(Paragraph("• <b>Attribute Redaction</b>: Automatically hides sensitive details (brand, color, unique mark, damage, image URL) from non-owners to eliminate fraudulent claim attempts.", bullet_style))

    # FR-5
    story.append(Paragraph("FR-5: Ownership Verification & Claim Review Module", h2_style))
    story.append(Paragraph("• <b>Verification Questionnaire</b>: Requires claimants to answer specific hidden item parameters.", bullet_style))
    story.append(Paragraph("• <b>Weighted Scoring</b>: Calculates a match confidence score based on submitted answers vs. hidden found properties.", bullet_style))
    story.append(Paragraph("• <b>Admin Verification Flow</b>: Places claims in <i>pending</i> status for manual review and physical handover confirmation.", bullet_style))

    story.append(Spacer(1, 10))

    # Section 3: Hardware & Software Requirements
    story.append(Paragraph("3. System Prerequisites & Hardware Specs", h1_style))
    
    prereq_data = [
        [Paragraph("Resource", table_header_style), Paragraph("Minimum Requirement", table_header_style), Paragraph("Recommended Requirement", table_header_style)],
        [Paragraph("Processor", table_body_style), Paragraph("Intel Core i3 / AMD Ryzen 3 (Quad-core)", table_body_style), Paragraph("Intel Core i5 / AMD Ryzen 5 or higher", table_body_style)],
        [Paragraph("RAM Memory", table_body_style), Paragraph("4 GB RAM", table_body_style), Paragraph("8 GB RAM (for concurrent Node, Python & Mongo)", table_body_style)],
        [Paragraph("Disk Storage", table_body_style), Paragraph("2 GB free space", table_body_style), Paragraph("5 GB free SSD space", table_body_style)],
        [Paragraph("Node.js Runtime", table_body_style), Paragraph("v18.0.0 or higher", table_body_style), Paragraph("v20.x LTS", table_body_style)],
        [Paragraph("Python Environment", table_body_style), Paragraph("v3.10.0 or higher", table_body_style), Paragraph("v3.12.x", table_body_style)],
        [Paragraph("Database Engine", table_body_style), Paragraph("MongoDB Server v6.0+ (Port 27017)", table_body_style), Paragraph("MongoDB Atlas / Local v7.0+", table_body_style)]
    ]

    prereq_table = Table(prereq_data, colWidths=[120, 210, 210])
    prereq_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#312e81')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(prereq_table)

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceAfter=8))
    story.append(Paragraph("Generated automatically for Campus Lost & Found System — Software Requirements Specification Document", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#64748b'), alignment=1)))

    doc.build(story)
    print(f"PDF successfully created at: {output_pdf}")

if __name__ == '__main__':
    build_pdf()
