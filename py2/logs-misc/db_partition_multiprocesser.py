from __future__ import division, print_function

from multiprocessing import Manager, Pool
import time

# note- resizing pycharm terminal to see what processes finished is bugged and
# can delete a few lines printed to the terminal.  Scroll instead, or resize
# terminal before a ctrl-c


def perform_partitions_work(partition_ranges, num_processes, consumer):
    start = time.time()

    manager = Manager()

    q = manager.Queue()
    for partition_range in partition_ranges:
        q.put(partition_range)

    pool = Pool(num_processes)
    for i in range(num_processes):
        pool.apply_async(
            consumer,
            (i, q,),
            callback=callback)
    pool.close()
    print('closed pool')
    try:
        print('waiting on pool')
        pool.join()
        print('pool finished')
    except KeyboardInterrupt:
        pool.terminate()

    print('done. took %s' % (time.time() - start))


def callback(data):
    print("Finished: %s" % (data,))


def terminate_pool_and_raise(exception, pool):
    pool.terminate()
    raise exception
