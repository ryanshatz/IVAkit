'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { cn } from '@/lib/utils';

function CustomEdgeComponent({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    selected,
    markerEnd,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <path
                id={id}
                className={cn(
                    'react-flow__edge-path transition-all duration-200',
                    selected && 'stroke-primary'
                )}
                d={edgePath}
                markerEnd={markerEnd}
                strokeWidth={selected ? 3 : 2}
                stroke={selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                fill="none"
            />

            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className={cn(
                            'rounded-full bg-card px-2 py-0.5 text-xs font-medium border shadow-sm',
                            selected ? 'border-primary text-primary' : 'border-border text-muted-foreground'
                        )}
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export const CustomEdge = memo(CustomEdgeComponent);
