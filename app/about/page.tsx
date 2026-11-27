import type { Metadata } from 'next';
import AboutGallery from './AboutGallery';

export const metadata: Metadata = {
  title: '欢迎走进 Jerry 的世界｜数字造物工坊',
  description: '看看 Jerry 正在琢磨的 AI 点子、做过的项目，还有工作之外的日常。',
};

export default function AboutPage() {
  return <AboutGallery />;
}
