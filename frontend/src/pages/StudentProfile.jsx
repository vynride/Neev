import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Award,
  BookOpen,
  Code2,
  MessageSquare,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Save,
  Sparkles,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { Card, Badge } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { mockStudent } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export const StudentProfile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(mockStudent);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(mockStudent.bio);

  const handleSaveBio = () => {
    setStudent(prev => ({ ...prev, bio: bioText }));
    setIsEditingBio(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1180px', margin: '0 auto' }}>
      {/* Top Profile Header Hero Card */}
      <Card style={{ padding: '32px', background: 'linear-gradient(135deg, #FAFBF8 0%, #F0FDF4 100%)', border: '1.5px solid #DCFCE7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Avatar with mint/green border matching the 2nd image */}
            <div style={{ position: 'relative' }}>
              <img
                src={student.avatar}
                alt={student.fullName}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3.5px solid #86EFAC',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  width: '16px',
                  height: '16px',
                  background: '#22C55E',
                  borderRadius: '50%',
                  border: '2.5px solid #FFFFFF'
                }}
                title="Active in Fellowship"
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                  {student.fullName}
                </h1>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#166534',
                    background: '#DCFCE7',
                    padding: '3px 10px',
                    borderRadius: '999px'
                  }}
                >
                  {student.title}
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
                {student.program} · {student.batch}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} color="#64748B" /> {student.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={14} color="#64748B" /> {student.phone}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} color="#64748B" /> {student.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={14} color="var(--color-primary)" /> ID: <strong>{student.studentId}</strong>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              onClick={() => navigate('/student/mentor')}
              variant="primary"
              size="sm"
              icon={Sparkles}
            >
              Ask AI Mentor
            </Button>
            <Button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              variant="outline"
              size="sm"
              icon={LogOut}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Bio Section */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(22, 101, 52, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Student Statement & Focus
            </span>
            <button
              onClick={() => setIsEditingBio(!isEditingBio)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}
            >
              <Edit3 size={13} /> {isEditingBio ? 'Cancel' : 'Edit Statement'}
            </button>
          </div>

          {isEditingBio ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-primary)',
                  fontSize: '0.88rem'
                }}
              />
              <Button onClick={handleSaveBio} variant="primary" size="sm" icon={Save} style={{ width: 'fit-content' }}>
                Save Statement
              </Button>
            </div>
          ) : (
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
              “{student.bio}”
            </p>
          )}
        </div>
      </Card>

      {/* Barabari System Evaluation Scores (CodeGuru & Samvad Saathi) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Award size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Barabari Evaluation Benchmarks
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            (Pre-project baseline assessment from CodeGuru & Samvad Saathi)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* CodeGuru Evaluation Card */}
          <Card style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#DCFCE7', padding: '8px', borderRadius: '8px', color: '#166534' }}>
                  <Code2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>CodeGuru Evaluation</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Technical & Architecture Assessment</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {student.evaluations.codeGuru.score}<span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/100</span>
                </div>
                <Badge variant="green">{student.evaluations.codeGuru.badge}</Badge>
              </div>
            </div>

            <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', margin: '14px 0', overflow: 'hidden' }}>
              <div style={{ width: `${student.evaluations.codeGuru.score}%`, height: '100%', background: 'var(--color-primary)' }} />
            </div>

            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
              “{student.evaluations.codeGuru.feedback}”
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {student.evaluations.codeGuru.strengths.map((str) => (
                <span key={str} style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  ✓ {str}
                </span>
              ))}
            </div>
          </Card>

          {/* Samvad Saathi Evaluation Card */}
          <Card style={{ borderLeft: '4px solid var(--color-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#FFEDD5', padding: '8px', borderRadius: '8px', color: '#C2410C' }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Samvad Saathi Evaluation</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Communication & Client Alignment</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                  {student.evaluations.samvadSaathi.score}<span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/100</span>
                </div>
                <Badge variant="orange">{student.evaluations.samvadSaathi.badge}</Badge>
              </div>
            </div>

            <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', margin: '14px 0', overflow: 'hidden' }}>
              <div style={{ width: `${student.evaluations.samvadSaathi.score}%`, height: '100%', background: 'var(--color-accent)' }} />
            </div>

            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
              “{student.evaluations.samvadSaathi.feedback}”
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {student.evaluations.samvadSaathi.strengths.map((str) => (
                <span key={str} style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  ✓ {str}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 2-Column Section: Project Assignment & Assigned Mentor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.1fr)', gap: '24px' }}>
        {/* Assigned Project Card */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Assigned Freelance Project</h3>
            </div>
            <Badge variant="green">{student.assignedProject.stage}</Badge>
          </div>

          <div style={{ background: '#FAFBF8', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
              {student.assignedProject.name}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Client: <strong>{student.assignedProject.client}</strong> · Role: <strong>{student.assignedProject.role}</strong>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Sprint Completion</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{student.assignedProject.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${student.assignedProject.progress}%`, height: '100%', background: 'var(--color-primary)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/project?tab=overview')}
              style={{ flex: 1 }}
            >
              View Project Progress
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/student/project?tab=tasks')}
              style={{ flex: 1 }}
            >
              View My Tasks
            </Button>
          </div>
        </Card>

        {/* Assigned Barabari Mentor Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Dedicated Barabari Mentor</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#FAFBF8', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
            <img
              src={student.assignedMentor.avatar}
              alt={student.assignedMentor.name}
              style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {student.assignedMentor.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {student.assignedMentor.title}
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: '2px' }}>
                {student.assignedMentor.company}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Next Scheduled Sync: <strong>{student.assignedMentor.nextSync}</strong>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/mentor')}
            style={{ width: '100%' }}
          >
            Direct Mentor Sync & AI Review
          </Button>
        </Card>
      </div>

      {/* Technical Skill Matrix */}
      <Card>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '16px' }}>
          Verified Technical Skills
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
          {student.skills.map((skill) => (
            <div
              key={skill.name}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: '#F8FAFC',
                border: '1px solid var(--color-border)'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                {skill.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{skill.category}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', background: '#DCFCE7', padding: '1px 6px', borderRadius: '4px' }}>
                  {skill.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
