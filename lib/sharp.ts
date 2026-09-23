import sharp from 'sharp'

// sharp only defaults glibc to one thread per image while MALLOC_ARENA_MAX is unset, and the
// production image sets it: left to itself, each upload would fan out to one thread per core.
sharp.concurrency(1)
// Uploads rarely repeat an operation with the same arguments, so the libvips operation cache
// would mostly hold native memory from one request to the next.
sharp.cache(false)

export default sharp
