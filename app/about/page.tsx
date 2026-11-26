import type { Metadata } from 'next';
import AboutGallery from './AboutGallery';

export const metadata: Metadata = {
  title: 'jerry 的作品展｜数字造物工坊',
  description: '走进 jerry 的微缩展厅，看看产品设计和企业 AI 项目。',
};

export default function AboutPage() {
  return <AboutGallery />;
}
