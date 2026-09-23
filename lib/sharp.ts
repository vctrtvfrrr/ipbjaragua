import sharp from 'sharp'

// sharp only defaults glibc to one thread per image while MALLOC_ARENA_MAX is unset, and the
// production image sets it: left to itself, each upload would fan out to one thread per core.
sharp.concurrency(1)
// Each image is read once, so the libvips operation cache never hits and only holds native
// memory between requests.
sharp.cache(false)

export default sharp
