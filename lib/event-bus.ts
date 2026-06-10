type SSEController = ReadableStreamDefaultController<Uint8Array>;

export interface TaskEvent {
  type: "task.created" | "task.updated" | "task.deleted";
  taskId: string;
  /** Owner of the task — used for per-user routing */
  taskUserId: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}

class EventBus {
  private readonly userSubs = new Map<string, Set<SSEController>>();
  private readonly adminSubs = new Set<SSEController>();
  private readonly encoder = new TextEncoder();

  subscribe(userId: string, isAdmin: boolean, controller: SSEController): void {
    if (isAdmin) {
      this.adminSubs.add(controller);
    } else {
      if (!this.userSubs.has(userId)) {
        this.userSubs.set(userId, new Set());
      }
      this.userSubs.get(userId)!.add(controller);
    }
  }

  unsubscribe(userId: string, isAdmin: boolean, controller: SSEController): void {
    if (isAdmin) {
      this.adminSubs.delete(controller);
    } else {
      this.userSubs.get(userId)?.delete(controller);
    }
  }

  publish(event: TaskEvent): void {
    const bytes = this.encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

    // Deliver to the task owner's connected clients
    const ownerSubs = this.userSubs.get(event.taskUserId);
    if (ownerSubs) {
      for (const ctrl of ownerSubs) {
        try {
          ctrl.enqueue(bytes);
        } catch {
          ownerSubs.delete(ctrl);
        }
      }
    }

    // Deliver to all admin clients
    for (const ctrl of this.adminSubs) {
      try {
        ctrl.enqueue(bytes);
      } catch {
        this.adminSubs.delete(ctrl);
      }
    }
  }
}

export const eventBus = new EventBus();
