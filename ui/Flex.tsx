import React from 'react'

interface FlexProps {
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  children: React.ReactNode
  className?: string
}

const Flex: React.FC<FlexProps> = ({
  justify = 'flex-start',
  align = 'stretch',
  children,
  className = '',
}) => {
  return <div className={`flex justify-${justify} items-${align} ${className}`}>{children}</div>
}

export default Flex
