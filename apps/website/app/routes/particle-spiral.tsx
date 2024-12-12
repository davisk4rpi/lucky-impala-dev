export default function ParticleSpiral() {
  return (
    <main className="h-screen w-screen bg-black">
      <canvas
        id="primary-canvas"
        className="h-screen w-screen fixed inset-0 bg-black"
      />
      <script type="module" src="/particle-spiral/run-screen-saver.js" />
    </main>
  );
}
