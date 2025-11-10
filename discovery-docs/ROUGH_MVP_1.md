Plenno Web App

Plenno is a Software-as-a-Service (SaaS) platform designed to be the operations and finance command center for international study agencies. Our mission is to replace manual, fragmented, and error-prone management based on spreadsheets with an intelligent, centralized system that provides clarity, control, and automation.


Phase 1: MVP v1.0
Data Centralization:
Registry of Agencies and Users with roles (admin, agency_user).
Directory of Colleges with their commercial conditions (default commission, GST settings, bonuses).
Management of Branches per college.
Database of Students with their contact information and visa status (Only those who are related to a payment plan).
Payment plan management.
Flexible Payment Plan Management:
Creation of multiple payment plans per student.
Manual and auto creation process (Instalments).
Payment plan edits.
Check by status, college, time, etc.
Precise calculation of the commissionable value, discounting costs for materials and administrative fees.
Payment Tracking and Control:
An automatic "bot" that updates the status of installments.
Status
- Draft - Payment plan and Instalments are being created.
- Pending - Not paid and date < Due Day
- Due Soon - It should be automatic.Not Paid, this should be active n days before Due Payment (5pm).
- Over Due - It should be automatic. Not Paid, Date > 5pm Due day.
- Paid - Student has paid and Agency knows it.
- Completed - Instalment is paid and Agency has received the commission.
A system to record notes and payment agreements on each installment, centralizing communication.
Business Intelligence Dashboard:
○  	Key KPIs: Commissions due, total overdue, income received, and a 90-day projection.
○  	Cash Flow Chart: Visualization of past, present, and future income, stacked by status (paid, pending, overdue).
○  	Action Modules: Lists of overdue and upcoming payments for proactive management.
○  	Strategic Analysis: Charts for Top 5 Colleges by revenue and new plans per month.
Enterprise-Level Security and Auditing:
Multi-tenant Architecture: Total isolation of each agency's data through RLS.
Audit Log (audit_log): Complete traceability of every change (creation, edit, deletion) made on the platform, recording who made the change and when for Colleges, Students, Payment Plans, Instalments, Profile.
      6. Reports
The agency can make reports of anything. 
Filter by dates, Colleges, Students, status, etc.
Download csv/pdf.
Charts, Kpis? I would like the possibility to preset them, so they can avoid going to excel or power BI

