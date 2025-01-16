import moment from "npm:moment";

export default (
  { time }: Lume.Data & { time: Date },
) => {
  return (
    <time datetime={time.toISOString()} class="relative-time">
      {moment(time).fromNow()}
    </time>
  );
};
