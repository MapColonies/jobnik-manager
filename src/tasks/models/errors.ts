export class TaskNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, TaskNotFoundError.prototype);
  }
}

export const errorMessages = {
  /**Signifies that the specified task could not be located*/
  taskNotFound: 'TASK_NOT_FOUND',
  /**Signifies that the specified task could not be added*/
  addTaskNotAllowed: 'ADD_TASK_NOT_ALLOWED',
} as const;
