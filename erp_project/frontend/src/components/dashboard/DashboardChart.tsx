import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './dashboard.css';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

type ChartType = 'line' | 'bar' | 'doughnut';

interface Props {
  type?: ChartType;
  data: ChartData<any, any, any>;
  options?: ChartOptions<any>;
  onElementClick?: (e: any) => void;
}

const DashboardChart: React.FC<Props> = ({ type = 'line', data, options, onElementClick }) => {
  const commonOptions: any = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    ...options
  };

  if (type === 'doughnut') {
    return (
      <div className="dashboard-chart">
        <Doughnut
          data={data}
          options={commonOptions}
          onClick={((evt: any, elements: any) => onElementClick && onElementClick({ evt, elements })) as any}
        />
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="dashboard-chart">
        <Bar
          data={data}
          options={commonOptions}
          onClick={((evt: any, elements: any) => onElementClick && onElementClick({ evt, elements })) as any}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-chart">
      <Line
        data={data}
        options={commonOptions}
        onClick={((evt: any, elements: any) => onElementClick && onElementClick({ evt, elements })) as any}
      />
    </div>
  );
};

export default DashboardChart;
