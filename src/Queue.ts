export class Queue<T> {
    queue: Array<T>
    enqueueIndex: number
    dequeueIndex: number
    initialQueueSize: number

    constructor(initialQueueSize: number) {
        this.queue = new Array(initialQueueSize)
        this.enqueueIndex = 0
        this.dequeueIndex = 0
        this.initialQueueSize = initialQueueSize
    }

    enqueue(item: T) {
        this.enqueueIndex < this.initialQueueSize ? this.queue[this.enqueueIndex++] = item : this.queue.push(item)
    }

    dequeue() {
        return this.queue[this.dequeueIndex++]
    }

    isEmpty() {
        return this.dequeueIndex === this.enqueueIndex
    }
}