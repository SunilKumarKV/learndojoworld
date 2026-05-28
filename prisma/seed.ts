import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({
      create: {
        name: "JavaScript",
        slug: "javascript",
        description: "Core language fundamentals and interview-ready patterns.",
      },
      update: {},
      where: { slug: "javascript" },
    }),
    prisma.category.upsert({
      create: {
        name: "React",
        slug: "react",
        description: "Build interactive interfaces with modern React patterns.",
      },
      update: {},
      where: { slug: "react" },
    }),
    prisma.category.upsert({
      create: {
        name: "Node.js",
        slug: "node-js",
        description: "Create APIs, tooling, and backend services with Node.js.",
      },
      update: {},
      where: { slug: "node-js" },
    }),
  ]);

  const courseSeed = [
    {
      categoryId: categories[1]?.id ?? categories[0].id,
      description:
        "Learn how React components, props, and state work together to build resilient interfaces. This course covers component structure, event handling, and practical patterns for real product work.",
      difficulty: "BEGINNER" as const,
      isFree: true,
      language: "English",
      slug: "react-fundamentals",
      status: "PUBLISHED" as const,
      subtitle: "Build your first production-ready React interfaces.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?auto=format&fit=crop&w=900&q=80",
      title: "React Fundamentals",
    },
    {
      categoryId: categories[0].id,
      description:
        "Prepare for technical interviews with practical JavaScript questions, common pitfalls, and clean problem-solving patterns that matter in modern teams.",
      difficulty: "INTERMEDIATE" as const,
      isFree: true,
      language: "English",
      slug: "javascript-interview-prep",
      status: "PUBLISHED" as const,
      subtitle: "Sharpen your JavaScript reasoning for real interviews.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      title: "JavaScript Interview Prep",
    },
    {
      categoryId: categories[2].id,
      description:
        "Learn how to set up a Node.js server, create REST routes, and structure backend code with clear modules and real-world examples.",
      difficulty: "BEGINNER" as const,
      isFree: true,
      language: "English",
      slug: "node-js-basics",
      status: "PUBLISHED" as const,
      subtitle: "Create solid backend foundations with Node.js.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80",
      title: "Node.js Basics",
    },
  ];

  for (const course of courseSeed) {
    const createdCourse = await prisma.course.upsert({
      create: {
        ...course,
        currency: "USD",
        description: course.description,
        price: null,
        publishedAt: new Date(),
      },
      update: {},
      where: { slug: course.slug },
    });

    await prisma.courseModule.deleteMany({ where: { courseId: createdCourse.id } });

    const modules: Array<{
      title: string;
      order: number;
      lessons: Array<{
        title: string;
        slug: string;
        type: "VIDEO" | "ARTICLE" | "EXERCISE";
        order: number;
        content: string;
        isPreview?: boolean;
        durationSec?: number;
        videoUrl?: string;
      }>;
    }> = [];

    if (course.slug === "react-fundamentals") {
      modules.push({
        lessons: [
          {
            content:
              "React components describe a UI by returning JSX and can manage local rendering state with hooks. Start by breaking the interface into small, focused pieces so each component has one responsibility.",
            isPreview: true,
            order: 1,
            slug: "what-is-a-component",
            title: "What is a component?",
            type: "ARTICLE" as const,
          },
          {
            content:
              "Props allow parent components to pass values into child components. Use them for configuration, labels, and small pieces of data that should remain readable from the top of the tree.",
            order: 2,
            slug: "using-props",
            title: "Using props",
            type: "ARTICLE" as const,
          },
          {
            content:
              "State lets a component react to user input. Use useState for simple values and build each interactive piece in a small, testable way.",
            order: 3,
            slug: "managing-state",
            title: "Managing state",
            type: "VIDEO" as const,
            videoUrl: "https://example.com/react-state.mp4",
            durationSec: 900,
          },
        ],
        order: 1,
        title: "Core React concepts",
      });
    }

    if (course.slug === "javascript-interview-prep") {
      modules.push({
        lessons: [
          {
            content:
              "Interview prep begins with clarity: explain what the code does before you describe the trade-offs. Practice talking through scope, closures, and asynchronous patterns in plain language.",
            isPreview: true,
            order: 1,
            slug: "interview-thinking-patterns",
            title: "Interview thinking patterns",
            type: "ARTICLE" as const,
          },
          {
            content:
              "Closures are created when a function captures variables from its parent scope. Use them to model private state, callbacks, and reusable logic in a controlled way.",
            order: 2,
            slug: "closures-and-scope",
            title: "Closures and scope",
            type: "ARTICLE" as const,
          },
          {
            content:
              "Promises and async/await are the standard way to manage asynchronous work in JavaScript. Learn to structure each request so the error path is predictable and readable.",
            order: 3,
            slug: "async-patterns",
            title: "Async patterns",
            type: "VIDEO" as const,
            videoUrl: "https://example.com/js-async.mp4",
            durationSec: 780,
          },
        ],
        order: 1,
        title: "JavaScript foundations",
      });
    }

    if (course.slug === "node-js-basics") {
      modules.push({
        lessons: [
          {
            content:
              "Node.js is a runtime that lets you build servers and tooling with JavaScript. A clean project structure starts with clear entry points, routes, and small modules.",
            isPreview: true,
            order: 1,
            slug: "node-runtime-overview",
            title: "Node runtime overview",
            type: "ARTICLE" as const,
          },
          {
            content:
              "Create a simple REST endpoint to handle incoming requests, validate inputs, and return structured JSON responses.",
            order: 2,
            slug: "building-an-api-route",
            title: "Building an API route",
            type: "ARTICLE" as const,
          },
          {
            content:
              "Use environment variables for configuration and separate business logic from HTTP handlers so your code stays easy to test and extend.",
            order: 3,
            slug: "configuration-and-structure",
            title: "Configuration and structure",
            type: "VIDEO" as const,
            videoUrl: "https://example.com/node-structure.mp4",
            durationSec: 840,
          },
        ],
        order: 1,
        title: "Backend foundations",
      });
    }

    for (const module of modules) {
      const createdModule = await prisma.courseModule.create({
        data: {
          courseId: createdCourse.id,
          order: module.order,
          title: module.title,
        },
      });

      await prisma.lesson.createMany({
        data: module.lessons.map((lesson) => ({
          content: lesson.content,
          durationSec: lesson.durationSec ?? null,
          isPreview: lesson.isPreview ?? false,
          moduleId: createdModule.id,
          order: lesson.order,
          slug: lesson.slug,
          title: lesson.title,
          type: lesson.type,
          videoUrl: lesson.videoUrl ?? null,
        })),
      });
    }
  }

  console.log("Seeded 3 published starter courses with modules and lessons.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
