"use client";

export default function StudyMaterialsRedirect() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <iframe
        src="/study-materials/index.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Study Materials & 3D Lab"
      />
    </div>
  );
}

