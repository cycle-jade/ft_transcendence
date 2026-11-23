// Purely decorative, slow-moving background panels.
// Sits behind all content (z-index 0), pointer-events disabled so it never
// blocks clicks. Pure CSS animation, no JS — cheap to render everywhere.
export default function BackgroundPanels() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="panel panel-1" />
      <div className="panel panel-2" />
      <div className="panel panel-3" />

      <style jsx>{`
        .panel {
          position: absolute;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(239, 68, 68, 0.04));
        }
        .panel-1 {
          width: 280px;
          height: 180px;
          top: -60px;
          left: -40px;
          animation: drift1 22s ease-in-out infinite;
        }
        .panel-2 {
          width: 220px;
          height: 220px;
          bottom: -80px;
          right: -40px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(249, 115, 22, 0.03));
          animation: drift2 26s ease-in-out infinite;
        }
        .panel-3 {
          width: 150px;
          height: 110px;
          top: 45%;
          right: 18%;
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), transparent);
          animation: drift1 18s ease-in-out infinite reverse;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(35px, 25px) rotate(8deg); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-25px, -20px) rotate(-6deg); }
        }
      `}</style>
    </div>
  );
}
