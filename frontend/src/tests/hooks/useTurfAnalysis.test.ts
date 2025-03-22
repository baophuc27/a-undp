// import { renderHook } from '@testing-library/react-hooks';
// import { useTurfAnalysis } from '@/hooks/useTurfAnalysis';

// describe('useTurfAnalysis', () => {
//   it('calculates distance between two points', () => {
//     const { result } = renderHook(() => useTurfAnalysis());
    
//     const point1 = { lat: 0, lng: 0 };
//     const point2 = { lat: 1, lng: 1 };
    
//     const distance = result.current.calculateDistance(point1, point2);
    
//     // Approximate distance between these points in kilometers
//     expect(distance).toBeCloseTo(157, 0); // Within 1 km precision
//   });
  
//   it('creates a buffer around a point', () => {
//     const { result } = renderHook(() => useTurfAnalysis());
    
//     const point = { lat: 0, lng: 0 };
//     const buffer = result.current.createBuffer(point, 1);
    
//     expect(buffer).toBeDefined();
//     if (buffer) { // Add this type guard
//       expect(buffer.geometry.type).toBe('Polygon');
//     }
//   });
// });