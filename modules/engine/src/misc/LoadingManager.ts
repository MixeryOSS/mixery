import { SimpleEmitter } from "./Emitter.js";

export class LoadingManager {
    pendingTasksInThisRound = 0;
    totalTasksInThisRound = 0;
    isLoadingMode = false;

    // Events
    readonly onStateChange = new SimpleEmitter<LoadingManager>();

    add(task: Promise<any>) {
        if (!this.isLoadingMode) {
            this.isLoadingMode = true;
            this.pendingTasksInThisRound = 0;
            this.totalTasksInThisRound = 0;
        }

        this.pendingTasksInThisRound++;
        this.totalTasksInThisRound++;
        this.onStateChange.emit(this);

        task.then(() => {
            this.pendingTasksInThisRound--;

            if (this.pendingTasksInThisRound <= 0) {
                this.pendingTasksInThisRound = 0;
                this.totalTasksInThisRound = 0;
                this.isLoadingMode = false;
            }
            
            this.onStateChange.emit(this);
        });
    }
}