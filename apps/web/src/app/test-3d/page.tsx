import FloorPlan3D from '../../modules/inventory/components/FloorPlan3D';

export default function TestPage() {
  const activeDevices = [
    {
      id: 'd1',
      name: 'MacBook Pro',
      type: 'LAPTOP',
      position: [0, 0.5, 2] as [number, number, number],
      status: 'SAFE' as 'SAFE',
    },
    {
      id: 'd2',
      name: 'iPad Pro',
      type: 'PHONE',
      position: [-3, 0.5, -2] as [number, number, number],
      status: 'ALERT' as 'ALERT',
    }
  ];
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test FloorPlan3D</h1>
      <FloorPlan3D activeDevices={activeDevices} />
    </div>
  );
}
