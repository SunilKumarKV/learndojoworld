import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CourseStatus, LessonType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";
import type {
  CreateCreatorCourseDto,
  UpdateCreatorCourseDto,
} from "./dto/course-builder/course-basic-info.dto";
import type {
  CreateCreatorLessonDto,
  UpdateCreatorLessonDto,
} from "./dto/course-builder/course-lesson.dto";
import type {
  CreateCreatorModuleDto,
  UpdateCreatorModuleDto,
} from "./dto/course-builder/course-module.dto";

@Injectable()
export class CreatorCourseBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(creatorId: string, dto: CreateCreatorCourseDto) {
    await this.ensureCreator(creatorId);
    await this.ensureCategory(dto.categoryId);

    const title = dto.title.trim();
    const slug = await this.createUniqueCourseSlug(title);

    const course = await this.prisma.course.create({
      data: {
        categoryId: dto.categoryId,
        creatorId,
        currency: "USD",
        description: dto.description.trim(),
        difficulty: dto.difficulty,
        isFree: true,
        language: dto.language.trim() || "English",
        price: null,
        slug,
        status: CourseStatus.DRAFT,
        subtitle: dto.subtitle?.trim() || null,
        thumbnailUrl: dto.thumbnailUrl?.trim() || null,
        title,
      },
      include: creatorCourseInclude,
    });

    return this.serializeCourse(course);
  }

  async listCourses(creatorId: string) {
    await this.ensureCreator(creatorId);

    const courses = await this.prisma.course.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
      orderBy: { updatedAt: "desc" },
      where: { creatorId },
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      subtitle: course.subtitle,
      description: course.description,
      status: course.status,
      difficulty: course.difficulty,
      language: course.language,
      thumbnailUrl: course.thumbnailUrl,
      category: course.category,
      enrollmentCount: course._count.enrollments,
      moduleCount: course._count.modules,
      publishedAt: course.publishedAt,
      updatedAt: course.updatedAt,
    }));
  }

  async getCourse(creatorId: string, courseId: string) {
    await this.ensureCreator(creatorId);
    const course = await this.findOwnedCourse(creatorId, courseId);

    return this.serializeCourse(course);
  }

  async updateCourse(creatorId: string, courseId: string, dto: UpdateCreatorCourseDto) {
    await this.ensureCreator(creatorId);
    await this.findOwnedCourse(creatorId, courseId);

    if (dto.categoryId) {
      await this.ensureCategory(dto.categoryId);
    }

    const data: Prisma.CourseUpdateInput = {
      ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
      ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
      ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
      ...(dto.language !== undefined ? { language: dto.language.trim() || "English" } : {}),
      ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle.trim() || null } : {}),
      ...(dto.thumbnailUrl !== undefined ? { thumbnailUrl: dto.thumbnailUrl.trim() || null } : {}),
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
    };

    const course = await this.prisma.course.update({
      data,
      include: creatorCourseInclude,
      where: { id: courseId },
    });

    return this.serializeCourse(course);
  }

  async deleteCourse(creatorId: string, courseId: string) {
    await this.ensureCreator(creatorId);
    const course = await this.findOwnedCourse(creatorId, courseId);

    if (course.status !== CourseStatus.DRAFT) {
      throw new ConflictException("Only draft courses can be deleted.");
    }

    await this.prisma.course.delete({ where: { id: courseId } });

    return { deleted: true };
  }

  async createModule(creatorId: string, courseId: string, dto: CreateCreatorModuleDto) {
    await this.ensureCreator(creatorId);
    await this.findOwnedCourse(creatorId, courseId);

    const order = dto.order ?? (await this.getNextModuleOrder(courseId));

    const module = await this.prisma.courseModule.create({
      data: {
        courseId,
        order,
        title: dto.title.trim(),
      },
      include: { lessons: { orderBy: { order: "asc" } } },
    });

    return module;
  }

  async updateModule(creatorId: string, moduleId: string, dto: UpdateCreatorModuleDto) {
    await this.ensureCreator(creatorId);
    await this.findOwnedModule(creatorId, moduleId);

    return this.prisma.courseModule.update({
      data: {
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      },
      include: { lessons: { orderBy: { order: "asc" } } },
      where: { id: moduleId },
    });
  }

  async deleteModule(creatorId: string, moduleId: string) {
    await this.ensureCreator(creatorId);
    await this.findOwnedModule(creatorId, moduleId);

    await this.prisma.courseModule.delete({ where: { id: moduleId } });

    return { deleted: true };
  }

  async createLesson(creatorId: string, moduleId: string, dto: CreateCreatorLessonDto) {
    await this.ensureCreator(creatorId);
    await this.findOwnedModule(creatorId, moduleId);
    const title = dto.title.trim();
    const slug = await this.createUniqueLessonSlug(moduleId, title);
    const order = dto.order ?? (await this.getNextLessonOrder(moduleId));

    return this.prisma.lesson.create({
      data: {
        content: dto.content.trim(),
        moduleId,
        order,
        slug,
        title,
        type: dto.type ?? LessonType.TEXT,
      },
      include: {
        module: { select: { courseId: true } },
      },
    });
  }

  async updateLesson(creatorId: string, lessonId: string, dto: UpdateCreatorLessonDto) {
    await this.ensureCreator(creatorId);
    await this.findOwnedLesson(creatorId, lessonId);

    return this.prisma.lesson.update({
      data: {
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
      },
      include: {
        module: { select: { courseId: true } },
      },
      where: { id: lessonId },
    });
  }

  async deleteLesson(creatorId: string, lessonId: string) {
    await this.ensureCreator(creatorId);
    await this.findOwnedLesson(creatorId, lessonId);

    await this.prisma.lesson.delete({ where: { id: lessonId } });

    return { deleted: true };
  }

  async submitForReview(creatorId: string, courseId: string) {
    await this.ensureCreator(creatorId);
    const course = await this.findOwnedCourse(creatorId, courseId);
    const validation = this.getReviewValidation(course);

    if (!validation.ready) {
      throw new BadRequestException({
        message: "Course is not ready for review.",
        checklist: validation.checklist,
      });
    }

    const updated = await this.prisma.course.update({
      data: { status: CourseStatus.PENDING_REVIEW },
      include: creatorCourseInclude,
      where: { id: courseId },
    });

    return this.serializeCourse(updated);
  }

  private async ensureCreator(userId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      select: { id: true },
      where: { userId },
    });

    if (!profile) {
      throw new ForbiddenException("Creator access is required.");
    }
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      select: { id: true },
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException("Category is required.");
    }
  }

  private async findOwnedCourse(creatorId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      include: creatorCourseInclude,
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException("Course not found.");
    }

    if (course.creatorId !== creatorId) {
      throw new ForbiddenException("You can only manage your own courses.");
    }

    return course;
  }

  private async findOwnedModule(creatorId: string, moduleId: string) {
    const module = await this.prisma.courseModule.findUnique({
      include: {
        course: { select: { creatorId: true } },
      },
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException("Module not found.");
    }

    if (module.course.creatorId !== creatorId) {
      throw new ForbiddenException("You can only manage your own courses.");
    }

    return module;
  }

  private async findOwnedLesson(creatorId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      include: {
        module: {
          include: {
            course: { select: { creatorId: true } },
          },
        },
      },
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found.");
    }

    if (lesson.module.course.creatorId !== creatorId) {
      throw new ForbiddenException("You can only manage your own courses.");
    }

    return lesson;
  }

  private async getNextModuleOrder(courseId: string) {
    const aggregate = await this.prisma.courseModule.aggregate({
      _max: { order: true },
      where: { courseId },
    });

    return (aggregate._max.order ?? 0) + 1;
  }

  private async getNextLessonOrder(moduleId: string) {
    const aggregate = await this.prisma.lesson.aggregate({
      _max: { order: true },
      where: { moduleId },
    });

    return (aggregate._max.order ?? 0) + 1;
  }

  private async createUniqueCourseSlug(title: string) {
    const base = slugify(title) || "course";
    let slug = base;
    let suffix = 1;

    while (await this.prisma.course.findUnique({ select: { id: true }, where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    return slug;
  }

  private async createUniqueLessonSlug(moduleId: string, title: string) {
    const base = slugify(title) || "lesson";
    let slug = base;
    let suffix = 1;

    while (
      await this.prisma.lesson.findUnique({
        select: { id: true },
        where: { moduleId_slug: { moduleId, slug } },
      })
    ) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    return slug;
  }

  private getReviewValidation(course: CreatorCourseWithDetails) {
    const hasTitle = Boolean(course.title.trim());
    const hasDescription = Boolean(course.description.trim());
    const hasCategory = Boolean(course.categoryId);
    const hasModule = course.modules.length > 0;
    const hasLesson = course.modules.some((module) => module.lessons.length > 0);

    const checklist = {
      hasTitle,
      hasDescription,
      hasCategory,
      hasModule,
      hasLesson,
    };

    return {
      checklist,
      ready: Object.values(checklist).every(Boolean),
    };
  }

  private serializeCourse(course: CreatorCourseWithDetails) {
    return {
      id: course.id,
      creatorId: course.creatorId,
      categoryId: course.categoryId,
      title: course.title,
      slug: course.slug,
      subtitle: course.subtitle,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      difficulty: course.difficulty,
      language: course.language,
      status: course.status,
      isFree: course.isFree,
      category: course.category,
      modules: course.modules.map((module) => ({
        id: module.id,
        courseId: module.courseId,
        title: module.title,
        order: module.order,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          moduleId: lesson.moduleId,
          title: lesson.title,
          slug: lesson.slug,
          type: lesson.type,
          order: lesson.order,
          content: lesson.content,
          isPreview: lesson.isPreview,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
        })),
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      publishedAt: course.publishedAt,
    };
  }
}

const creatorCourseInclude = {
  category: { select: { id: true, name: true, slug: true } },
  modules: {
    include: {
      lessons: { orderBy: { order: "asc" } },
    },
    orderBy: { order: "asc" },
  },
} satisfies Prisma.CourseInclude;

type CreatorCourseWithDetails = Prisma.CourseGetPayload<{
  include: typeof creatorCourseInclude;
}>;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
