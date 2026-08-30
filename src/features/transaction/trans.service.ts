import Api from '@/src/Api/api';
const create = require('zustand').create
const combine = require('zustand/middleware').combine

let timeOut: any

const useTransactionStore = create(
    combine(
        {
            transaction: {
                list: [] as any[],
                total: 0,
                page: 1,
                size: 10,
                search: null as string | null,
                status: null as string | null,
                paginate: true,
                loading: false,
            },
        },
        (set: any, get: any) => ({
            get: {
                list: async () => {
                    const {
                        transaction: { page, size, status },
                    } = get()

                    try {
                        set((prev) => ({
                            transaction: { ...prev.transaction, loading: true },
                        }))

                        const res = await Api.get('/transactions', {
                            query: {
                                page,
                                per_page: size,

                                ...(status ? { status } : {}),
                            },
                        })
                        console.log('res', res)
                        set((prev) => ({
                            transaction: {
                                ...prev.transaction,
                                list: res.transactions || [],
                                total: res.total || 0,
                                loading: false,
                            },
                        }))
                    } catch (err) {
                        console.error('Failed to load transactions', err)
                        set((prev) => ({
                            transaction: { ...prev.transaction, loading: false },
                        }))
                    }
                },

                paginate: ({
                    page,
                    size,
                    status,

                }: {
                    page?: number
                    size?: number
                    status?: string
                }) => {
                    clearTimeout(timeOut)

                    const init = () => {
                        set((prev) => ({
                            transaction: {
                                ...prev.transaction,
                                page: page || prev.transaction.page,
                                size: size || prev.transaction.size,
                                status: status || null,
                            },
                        }))
                        useTransactionStore.getState().get.list()
                    }

                    if (status) {
                        timeOut = setTimeout(() => {
                            init()
                        }, 1000)
                        set((prev) => ({
                            transaction: { ...prev.transaction, status },
                        }))
                        return
                    }

                    init()
                },
            },
        })
    )
)

export default useTransactionStore
