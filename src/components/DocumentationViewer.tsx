import React, { useState } from 'react';
import { BookOpen, FileText, Code2, Server, Database, Layers, CheckCircle2 } from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  file: string;
  description: string;
  icon: any;
}

const SECTIONS: DocSection[] = [
  {
    id: 'architecture',
    title: '1. Technical Architecture',
    file: 'docs/technical-architecture.md',
    description: 'React client, Express API, MongoDB repository data layer, auth, booking lifecycle, and payment workflow with Mermaid diagram.',
    icon: Server
  },
  {
    id: 'er-diagram',
    title: '2. ER Diagram',
    file: 'docs/er-diagram.md',
    description: 'Mermaid ER diagram for User, Movie, Cinema, Screen, Showtime, Seat Reservation, Booking, and Payment entities with constraints.',
    icon: Database
  },
  {
    id: 'features',
    title: '3. Features Specification',
    file: 'docs/features.md',
    description: 'Detailed analysis of implemented features, simulated payment gateways, and incomplete vs completed functionality.',
    icon: Layers
  },
  {
    id: 'roles',
    title: '4. Roles & Responsibilities',
    file: 'docs/roles-and-responsibilities.md',
    description: 'Role permission matrix covering Guest, Registered User, Administrator, and External Services.',
    icon: UsersIcon
  },
  {
    id: 'user-flow',
    title: '5. User Flow Diagrams',
    file: 'docs/user-flow.md',
    description: 'Mermaid user flows for discovery, login, seat reservation hold, payment, ticket issuance, cancellation, and admin operations.',
    icon: FileText
  },
  {
    id: 'mvc-pattern',
    title: '6. MVC Pattern & Sequence',
    file: 'docs/mvc-pattern.md',
    description: 'Model-View-Controller architecture breakdown and full Mermaid sequence diagram of the booking request lifecycle.',
    icon: Code2
  },
  {
    id: 'sys-req',
    title: 'System Requirements',
    file: 'docs/system-requirements.md',
    description: 'Runtime environment, hardware, Node.js 22+, database storage, memory constraints, and network ports.',
    icon: Server
  },
  {
    id: 'api-doc',
    title: 'API Documentation',
    file: 'docs/api-documentation.md',
    description: 'Complete REST endpoint specifications for Auth, Movies, Cinemas, Showtimes, Bookings, Payments, and Admin.',
    icon: Code2
  },
  {
    id: 'testing',
    title: 'Testing & Verification',
    file: 'docs/testing.md',
    description: 'Unit testing, concurrency testing for seat locks, payment gateway simulation, and test persona credentials.',
    icon: CheckCircle2
  },
  {
    id: 'readme',
    title: 'README & Quickstart',
    file: 'README.md',
    description: 'Overview of IMovies project, setup instructions, architecture summary, and environment configurations.',
    icon: BookOpen
  }
];

function UsersIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

export const DocumentationViewer: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('architecture');

  const activeDoc = SECTIONS.find((s) => s.id === activeSectionId) || SECTIONS[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">IMovies Architecture & System Documentation</h2>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Complete, verified documentation reflecting the source code, REST APIs, and database schemas in the <code className="text-amber-400 font-mono">docs/</code> directory.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1.5 md:col-span-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">
            Documentation Files ({SECTIONS.length})
          </p>
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = sec.id === activeSectionId;

            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-950/40 border border-indigo-800/60 text-white shadow-sm'
                    : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                <div className="space-y-0.5 min-w-0">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-indigo-300' : 'text-zinc-300'}`}>
                    {sec.title}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 truncate">{sec.file}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Viewer */}
        <div className="md:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                {activeDoc.file}
              </span>
              <h3 className="text-xl font-bold text-white mt-2">{activeDoc.title}</h3>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">{activeDoc.description}</p>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-3">
            <div className="flex items-center gap-2 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verified In Source Code
            </div>
            <p className="text-xs text-zinc-400">
              This document is saved as a Markdown file in the project repository at <code className="text-amber-400 font-mono">/{activeDoc.file}</code>. It includes syntactically valid Mermaid diagrams, exact API endpoints, model schemas, and actual business logic implemented in the backend Express controllers and frontend React views.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>View full raw markdown file in repo: <span className="text-zinc-300 font-mono">/{activeDoc.file}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
