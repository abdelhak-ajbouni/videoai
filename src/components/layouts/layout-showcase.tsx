"use client";

import { Container } from "@/components/layouts/container";
import { Grid, GridItem } from "@/components/layouts/grid";
import { Section, SectionHeader } from "@/components/layouts/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Grid3X3,
  Container as ContainerIcon,
  Layers,
  Smartphone,
  Tablet,
  Monitor
} from "lucide-react";

export function LayoutShowcase() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <Section spacing="md" background="gradient">
        <Container>
          <SectionHeader
            title="Layout & Grid System"
            subtitle="Responsive containers, flexible grids, and organized sections for modern web layouts"
            centered
          />
        </Container>
      </Section>

      {/* Container System */}
      <Section>
        <Container>
          <SectionHeader
            title="Container System"
            subtitle="Responsive containers with consistent padding and max-widths"
          />

          <div className="space-y-8">
            {/* Container Sizes */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ContainerIcon className="h-5 w-5" />
                  <span>Container Sizes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { size: "sm", width: "640px", description: "Small content, forms" },
                  { size: "md", width: "768px", description: "Medium content, articles" },
                  { size: "lg", width: "1024px", description: "Large content, dashboards" },
                  { size: "xl", width: "1280px", description: "Extra large, main layouts" },
                  { size: "2xl", width: "1536px", description: "Ultra wide, hero sections" },
                ].map((container) => (
                  <div key={container.size} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">
                        {container.size.toUpperCase()} - {container.width}
                      </span>
                      <span className="text-text-secondary">{container.description}</span>
                    </div>
                    <div className="relative bg-surface-elevated rounded-lg p-4 border border-border">
                      <Container size={container.size as 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'} className="bg-ai-primary-50 dark:bg-ai-primary-900/20 rounded-lg p-4 border border-ai-primary-200 dark:border-ai-primary-800">
                        <div className="text-center text-sm text-ai-primary-600 dark:text-ai-primary-400">
                          Container {container.size} - Max width: {container.width}
                        </div>
                      </Container>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Padding Options */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Padding Options</CardTitle>
              </CardHeader>
              <CardContent>
                <Grid responsive="cards" gap={4}>
                  {[
                    { padding: "none", px: "0px", description: "No padding" },
                    { padding: "sm", px: "16px", description: "Small padding" },
                    { padding: "md", px: "24px", description: "Medium padding" },
                    { padding: "lg", px: "32px", description: "Large padding" },
                    { padding: "xl", px: "48px", description: "Extra large padding" },
                  ].map((item) => (
                    <div key={item.padding} className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-text-primary">{item.padding}</span>
                        <span className="text-text-secondary ml-2">({item.px})</span>
                      </div>
                      <div className="bg-surface-elevated rounded-lg border border-border overflow-hidden">
                        <Container size="full" padding={item.padding as 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'} className="bg-ai-electric-50 dark:bg-ai-electric-900/20 py-3">
                          <div className="bg-ai-electric-100 dark:bg-ai-electric-900/30 rounded text-center text-xs text-ai-electric-600 dark:text-ai-electric-400 py-2">
                            {item.description}
                          </div>
                        </Container>
                      </div>
                    </div>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Grid System */}
      <Section background="surface">
        <Container>
          <SectionHeader
            title="Grid System"
            subtitle="Flexible CSS Grid layouts with responsive breakpoints and auto-sizing"
          />

          <div className="space-y-8">
            {/* Basic Grids */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Grid3X3 className="h-5 w-5" />
                  <span>Basic Grid Layouts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { cols: 2, label: "2 Columns" },
                  { cols: 3, label: "3 Columns" },
                  { cols: 4, label: "4 Columns" },
                  { cols: 6, label: "6 Columns" },
                ].map((grid) => (
                  <div key={grid.cols} className="space-y-2">
                    <h4 className="text-sm font-medium text-text-secondary">{grid.label}</h4>
                    <Grid cols={grid.cols as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12} gap={4}>
                      {Array.from({ length: grid.cols }, (_, i) => (
                        <div
                          key={i}
                          className="bg-ai-primary-50 dark:bg-ai-primary-900/20 border border-ai-primary-200 dark:border-ai-primary-800 rounded-lg p-4 text-center text-sm text-ai-primary-600 dark:text-ai-primary-400"
                        >
                          Item {i + 1}
                        </div>
                      ))}
                    </Grid>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Responsive Grids */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Responsive Grid Presets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { preset: "cards", label: "Cards Layout", description: "1 → 2 → 3 columns" },
                  { preset: "stats", label: "Stats Layout", description: "1 → 2 → 4 columns" },
                  { preset: "features", label: "Features Layout", description: "1 → 2 → 3 columns" },
                  { preset: "gallery", label: "Gallery Layout", description: "2 → 3 → 4 → 5 → 6 columns" },
                ].map((grid) => (
                  <div key={grid.preset} className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-text-primary">{grid.label}</h4>
                      <p className="text-xs text-text-secondary">{grid.description}</p>
                    </div>
                    <Grid responsive={grid.preset as 'cards' | 'features' | 'gallery'} gap={4}>
                      {Array.from({ length: grid.preset === "gallery" ? 12 : 6 }, (_, i) => (
                        <div
                          key={i}
                          className="bg-ai-electric-50 dark:bg-ai-electric-900/20 border border-ai-electric-200 dark:border-ai-electric-800 rounded-lg p-3 text-center text-xs text-ai-electric-600 dark:text-ai-electric-400"
                        >
                          {i + 1}
                        </div>
                      ))}
                    </Grid>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Grid Spanning */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Grid Item Spanning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-secondary">12 Column Grid with Spans</h4>
                  <Grid cols={12} gap={2}>
                    <GridItem span={12} className="bg-ai-neural-50 dark:bg-ai-neural-900/20 border border-ai-neural-200 dark:border-ai-neural-800 rounded-lg p-3 text-center text-sm text-ai-neural-600 dark:text-ai-neural-400">
                      Full Width (span 12)
                    </GridItem>
                    <GridItem span={6} className="bg-ai-primary-50 dark:bg-ai-primary-900/20 border border-ai-primary-200 dark:border-ai-primary-800 rounded-lg p-3 text-center text-sm text-ai-primary-600 dark:text-ai-primary-400">
                      Half (span 6)
                    </GridItem>
                    <GridItem span={6} className="bg-ai-primary-50 dark:bg-ai-primary-900/20 border border-ai-primary-200 dark:border-ai-primary-800 rounded-lg p-3 text-center text-sm text-ai-primary-600 dark:text-ai-primary-400">
                      Half (span 6)
                    </GridItem>
                    <GridItem span={4} className="bg-ai-electric-50 dark:bg-ai-electric-900/20 border border-ai-electric-200 dark:border-ai-electric-800 rounded-lg p-3 text-center text-sm text-ai-electric-600 dark:text-ai-electric-400">
                      Third (span 4)
                    </GridItem>
                    <GridItem span={4} className="bg-ai-electric-50 dark:bg-ai-electric-900/20 border border-ai-electric-200 dark:border-ai-electric-800 rounded-lg p-3 text-center text-sm text-ai-electric-600 dark:text-ai-electric-400">
                      Third (span 4)
                    </GridItem>
                    <GridItem span={4} className="bg-ai-electric-50 dark:bg-ai-electric-900/20 border border-ai-electric-200 dark:border-ai-electric-800 rounded-lg p-3 text-center text-sm text-ai-electric-600 dark:text-ai-electric-400">
                      Third (span 4)
                    </GridItem>
                    <GridItem span={8} className="bg-ai-neural-50 dark:bg-ai-neural-900/20 border border-ai-neural-200 dark:border-ai-neural-800 rounded-lg p-3 text-center text-sm text-ai-neural-600 dark:text-ai-neural-400">
                      Main Content (span 8)
                    </GridItem>
                    <GridItem span={4} className="bg-surface-elevated border border-border rounded-lg p-3 text-center text-sm text-text-secondary">
                      Sidebar (span 4)
                    </GridItem>
                  </Grid>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Section System */}
      <Section background="elevated">
        <Container>
          <SectionHeader
            title="Section System"
            subtitle="Organized content sections with consistent spacing and backgrounds"
          />

          <div className="space-y-8">
            {/* Section Backgrounds */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Layers className="h-5 w-5" />
                  <span>Section Backgrounds</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { bg: "none", label: "None", description: "Transparent background" },
                  { bg: "surface", label: "Surface", description: "Standard surface color" },
                  { bg: "elevated", label: "Elevated", description: "Elevated surface color" },
                  { bg: "primary", label: "Primary", description: "AI primary theme" },
                  { bg: "electric", label: "Electric", description: "AI electric theme" },
                  { bg: "neural", label: "Neural", description: "AI neural theme" },
                  { bg: "gradient", label: "Gradient", description: "AI gradient theme" },
                ].map((section) => (
                  <div key={section.bg} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{section.label}</span>
                      <span className="text-xs text-text-secondary">{section.description}</span>
                    </div>
                    <Section background={section.bg as 'default' | 'surface' | 'muted' | 'accent'} spacing="sm" className="rounded-lg">
                      <Container size="full" padding="md">
                        <div className="text-center text-sm text-text-primary">
                          Section with {section.label.toLowerCase()} background
                        </div>
                      </Container>
                    </Section>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Section Headers */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Section Headers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-text-secondary">Left Aligned with Action</h4>
                  <div className="border border-border rounded-lg p-6 bg-surface-elevated">
                    <SectionHeader
                      title="Feature Section"
                      subtitle="This is a left-aligned section header with an action button on the right side."
                      action={
                        <Button variant="ai-gradient" size="sm">
                          View All
                        </Button>
                      }
                    />
                    <div className="text-sm text-text-secondary">Section content would go here...</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-text-secondary">Centered with Action</h4>
                  <div className="border border-border rounded-lg p-6 bg-surface-elevated">
                    <SectionHeader
                      title="Hero Section"
                      subtitle="This is a centered section header with an action button below the content."
                      action={
                        <Button variant="ai-gradient">
                          Get Started
                        </Button>
                      }
                      centered
                    />
                    <div className="text-center text-sm text-text-secondary">Centered section content...</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Responsive Behavior */}
      <Section>
        <Container>
          <SectionHeader
            title="Responsive Behavior"
            subtitle="How layouts adapt across different screen sizes"
          />

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Breakpoint System</CardTitle>
            </CardHeader>
            <CardContent>
              <Grid responsive="features" gap={6}>
                {[
                  {
                    icon: <Smartphone className="h-6 w-6" />,
                    title: "Mobile",
                    size: "< 640px",
                    description: "Single column layouts, stacked content, touch-friendly spacing",
                    color: "ai-primary"
                  },
                  {
                    icon: <Tablet className="h-6 w-6" />,
                    title: "Tablet",
                    size: "640px - 1024px",
                    description: "2-3 column grids, balanced layouts, optimized for touch",
                    color: "ai-electric"
                  },
                  {
                    icon: <Monitor className="h-6 w-6" />,
                    title: "Desktop",
                    size: "> 1024px",
                    description: "Multi-column layouts, sidebar content, full feature access",
                    color: "ai-neural"
                  }
                ].map((device) => (
                  <Card key={device.title} variant="glass" className="text-center">
                    <CardContent className="p-6">
                      <div className={`p-3 rounded-full bg-${device.color}-100 dark:bg-${device.color}-900/30 w-fit mx-auto mb-4`}>
                        <div className={`text-${device.color}-600 dark:text-${device.color}-400`}>
                          {device.icon}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">{device.title}</h3>
                      <p className="text-sm font-medium text-text-secondary mb-3">{device.size}</p>
                      <p className="text-sm text-text-secondary">{device.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Section>

      {/* Implementation Examples */}
      <Section background="gradient">
        <Container>
          <SectionHeader
            title="Real-World Examples"
            subtitle="Common layout patterns using our system"
            centered
          />

          <div className="space-y-8">
            {/* Dashboard Layout Example */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Dashboard Layout Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-text-secondary mb-4">
                    Hero section + Stats grid + Content grid with sidebar
                  </div>
                  <div className="border border-border rounded-lg p-4 bg-surface space-y-4">
                    {/* Hero */}
                    <div className="bg-gradient-ai rounded-lg p-6 text-white text-center">
                      <h3 className="text-lg font-semibold mb-2">Welcome Hero Section</h3>
                      <p className="text-white/80 text-sm">Full-width hero with gradient background</p>
                    </div>

                    {/* Stats */}
                    <Grid responsive="stats" gap={4}>
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="bg-ai-primary-50 dark:bg-ai-primary-900/20 rounded-lg p-4 text-center">
                          <div className="text-lg font-bold text-ai-primary-600 dark:text-ai-primary-400">1,247</div>
                          <div className="text-xs text-text-secondary">Stat {i + 1}</div>
                        </div>
                      ))}
                    </Grid>

                    {/* Content + Sidebar */}
                    <Grid cols={12} gap={6}>
                      <GridItem span={8}>
                        <div className="bg-surface-elevated rounded-lg p-4 h-32 flex items-center justify-center text-sm text-text-secondary">
                          Main Content Area (8/12)
                        </div>
                      </GridItem>
                      <GridItem span={4}>
                        <div className="bg-ai-electric-50 dark:bg-ai-electric-900/20 rounded-lg p-4 h-32 flex items-center justify-center text-sm text-ai-electric-600 dark:text-ai-electric-400">
                          Sidebar (4/12)
                        </div>
                      </GridItem>
                    </Grid>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </div>
  );
}