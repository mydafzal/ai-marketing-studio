            showAdBudgetUI: {
                description: adBudgetModule.description,
                parameters: adBudgetModule.parameters,
                generate: async function* ({symbol, price, numberOfShares, guideForUser}) {
                    yield (
                        <BotCard>
                            <StockSkeleton/>
                        </BotCard>
                    )
                    
                    await sleep(1000)
                    
                    const toolCallId = nanoid()
                    const initialBudget = numberOfShares || price;
                    
                    if (initialBudget <= 0 || initialBudget > 1000) {
                        pushMessages([
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'showAdBudgetUI',
                                        toolCallId,
                                        args: {symbol, price, numberOfShares: initialBudget, guideForUser}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                            {
                                id: nanoid(),
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'showAdBudgetUI',
                                        toolCallId,
                                        result: {
                                            symbol,
                                            price,
                                            numberOfShares: initialBudget,
                                            status: 'expired',
                                            guideForUser
                                        }
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                            {
                                id: nanoid(),
                                role: 'system',
                                content: `[User has selected an invalid amount]`,
                                timestamp: new Date().toISOString()
                            }
                        ]);
                        
                        // Import and use the server component for invalid budget
                        const showBudgetSetter = (await import('@/components/stocks/set-budget')).default
                        return showBudgetSetter({symbol, price, numberOfShares, guideForUser})
                    }
                    
                    pushMessages([
                        {
                            id: nanoid(),
                            role: 'assistant',
                            content: [
                                {
                                    type: 'tool-call',
                                    toolName: 'showAdBudgetUI',
                                    toolCallId,
                                    args: {symbol, price, numberOfShares: initialBudget, guideForUser}
                                }
                            ],
                            timestamp: new Date().toISOString()
                        },
                        {
                            id: nanoid(),
                            role: 'tool',
                            content: [
                                {
                                    type: 'tool-result',
                                    toolName: 'showAdBudgetUI',
                                    toolCallId,
                                    result: {
                                        symbol,
                                        price,
                                        numberOfShares: initialBudget,
                                        guideForUser
                                    }
                                }
                            ],
                            timestamp: new Date().toISOString()
                        }
                    ])
                    
                    // Import and use the server component for valid budget
                    const showBudgetSetter = (await import('@/components/stocks/set-budget')).default
                    return showBudgetSetter({symbol, price, numberOfShares, guideForUser})
                }
            },