import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { SectionProps } from "@/types"

const colorClasses: Record<string, string> = {
  red: "text-red-500 bg-transparent border-red-500 hover:bg-red-500 hover:text-white transition-colors",
  blue: "text-blue-500 bg-transparent border-blue-500 hover:bg-blue-500 hover:text-white transition-colors",
}

export default function Section({ id, title, subtitle, content, isActive, buttons }: SectionProps) {
  return (
    <section id={id} className="relative h-screen w-full snap-start flex flex-col justify-center p-8 md:p-16 lg:p-24">
      {subtitle && (
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {subtitle}
        </motion.div>
      )}
      <motion.h2
        className="text-4xl md:text-6xl lg:text-[5rem] xl:text-[6rem] font-bold leading-[1.1] tracking-tight max-w-4xl text-white"
        initial={{ opacity: 0, y: 50 }}
        animate={isActive ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h2>
      {content && (
        <motion.p
          className="text-lg md:text-xl lg:text-2xl max-w-2xl mt-6 text-neutral-400"
          initial={{ opacity: 0, y: 50 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {content}
        </motion.p>
      )}
      {buttons && buttons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 md:mt-16 flex flex-wrap gap-4"
        >
          {buttons.map((btn) => (
            <Button
              key={btn.text}
              asChild
              variant="outline"
              size="lg"
              className={colorClasses[btn.color ?? 'red']}
            >
              <a href={btn.href ?? '#'}>{btn.text}</a>
            </Button>
          ))}
        </motion.div>
      )}
    </section>
  )
}
