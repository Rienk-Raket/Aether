// Which streets each icon takes. Five routes leave their own wedge (train, bus, car, restaurant, bar),
// reappear in the bottom wedge and end at the same crossing as the walker, who stays in the bottom wedge.

import { buildGraph, planRoute, rounded, smooth, roadPoints, ROAD_Y } from './splash-plan.js';

// Seconds. Everything arrives together at T_ARRIVE; the whole opening takes T_TOTAL.
export const T_OUT = 1.9; // way out through the own wedge
export const T_BACK_START = 2.5; // the others come back into the bottom wedge from here
export const T_BACK = 1.8;
export const T_ARRIVE = T_BACK_START + T_BACK;
export const T_TOTAL = 5;

const BOTTOM = 3;
const MEETING_NODE = [-1, -1]; // a crossing just above the canal

function leg(points, start, duration, curved = false) {
  return { d: curved ? smooth(points) : rounded(points, 9), start, duration };
}

// cities: from makeCities(). Returns the routes, the street graphs and the meeting point on the screen.
export function planRoutes(cities) {
  const graphs = cities.map((city) => (city.cfg.streets === false ? null : buildGraph(city)));
  const out = (wedge, waypoints) => planRoute(cities[wedge], graphs[wedge], waypoints);
  const back = (waypoints) => planRoute(cities[BOTTOM], graphs[BOTTOM], [...waypoints, { node: MEETING_NODE }]);
  const meeting = cities[BOTTOM].abs(...MEETING_NODE);

  const way = roadPoints(ROAD_Y[1], 1).filter(([x]) => x <= 140); // follows the middle winding road
  const routes = [
    {
      icon: 'train',
      legs: [
        leg(out(0, [[195, 322], [245, 235], [150, 150], { out: [180, -50] }]), 0, T_OUT),
        leg(back([{ out: [240, 900] }, [232, 780]]), T_BACK_START, T_BACK),
      ],
    },
    {
      icon: 'bus',
      legs: [
        leg(out(1, [[282, 372], [335, 305], [300, 215], { out: [440, 170] }]), 0, T_OUT),
        leg(back([{ out: [440, 800] }, [320, 740]]), T_BACK_START, T_BACK),
      ],
    },
    {
      icon: 'car',
      legs: [
        leg(out(2, [[282, 472], [340, 520], [305, 610], { out: [440, 730] }]), 0, T_OUT),
        leg(back([{ out: [440, 860] }, [300, 700]]), T_BACK_START, T_BACK),
      ],
    },
    {
      icon: 'walk',
      legs: [leg(out(BOTTOM, [[195, 542], [262, 640], [240, 735], [128, 705], { node: MEETING_NODE }]), 0, T_ARRIVE)],
    },
    {
      icon: 'restaurant',
      legs: [leg(way, 0, T_OUT, true), leg(back([{ out: [-50, 860] }, [60, 780]]), T_BACK_START, T_BACK)],
    },
    {
      icon: 'bar',
      legs: [
        leg(out(5, [[108, 372], [62, 330], [88, 250], { out: [-50, 160] }]), 0, T_OUT),
        leg(back([{ out: [-50, 800] }, [90, 720]]), T_BACK_START, T_BACK),
      ],
    },
  ];
  return { routes, graphs, meeting };
}
