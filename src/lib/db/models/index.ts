/**
 * Central export for all Mongoose models.
 * Import from here to avoid circular dependencies.
 */

export { default as User } from "./user.model";
export type { IUser, UserRole } from "./user.model";

import type { ISeoMetadata } from "@/lib/seo/types";

export { default as Post } from "./post.model";
export type { IPost, PostStatus, SchemaType } from "./post.model";
export type IPostSeo = ISeoMetadata;

export { default as Category } from "./category.model";
export type { ICategory } from "./category.model";

export { default as Tag } from "./tag.model";
export type { ITag } from "./tag.model";

export { default as Comment } from "./comment.model";
export type { IComment, CommentStatus } from "./comment.model";

export { default as Media } from "./media.model";
export type { IMedia } from "./media.model";

export { default as Series } from "./series.model";
export type { ISeries } from "./series.model";

export { default as Redirect } from "./redirect.model";
export type { IRedirect, RedirectType } from "./redirect.model";

export { default as Subscriber } from "./subscriber.model";
export type { ISubscriber, SubscriberStatus } from "./subscriber.model";

export { default as Revision } from "./revision.model";
export type { IRevision } from "./revision.model";

export { default as AuditLog } from "./audit-log.model";
export type { IAuditLog, AuditAction } from "./audit-log.model";

export { default as ViewStat } from "./view-stat.model";
export type { IViewStat } from "./view-stat.model";

export { default as AnalyticsSession } from "./analytics-session.model";
export type { IAnalyticsSession } from "./analytics-session.model";

export { default as Page } from "./page.model";
export type { IPage, IPageBlock } from "./page.model";

export { default as ContactMessage } from "./contact-message.model";
export type { IContactMessage } from "./contact-message.model";

export { default as Setting } from "./setting.model";
export type { IGlobalSettings, ISeoTemplateConfig } from "./setting.model";
